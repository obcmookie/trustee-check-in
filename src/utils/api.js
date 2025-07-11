// src/utils/api.js
import { supabase } from '../services/supabaseClient';

/**
 * Validate the QR code, check family scan limit, log the scan, and update counts.
 */
export async function validateQRCode(qrCodeValue) {
    // Step 1: Find the trustee by QR code
    const { data: trustee, error } = await supabase
        .from('trustees')
        .select('*')
        .eq('qr_code_value', qrCodeValue)
        .single();

    if (error || !trustee) {
        return { success: false, message: 'QR Code not found.' };
    }

    // Step 2: Check if daily scan count is within the limit
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (trustee.last_scan_date !== today) {
        // If it's a new day, reset the daily scan count
        const { error: updateError } = await supabase
            .from('trustees')
            .update({ daily_scan_count: 0, last_scan_date: today })
            .eq('id', trustee.id);

        if (updateError) {
            return { success: false, message: 'Error resetting daily count.', trustee };
        }

        // Refresh trustee data
        trustee.daily_scan_count = 0;
        trustee.last_scan_date = today;
    }

    if (trustee.daily_scan_count >= trustee.family_size_limit) {
        // ✅ Return trustee on failure so we can display scan log
        return { success: false, message: 'Daily scan limit reached.', trustee };
    }

    // Step 3: Log the scan
    const { error: logError } = await supabase.from('scan_logs').insert([
        { trustee_id: trustee.id }
    ]);

    if (logError) {
        return { success: false, message: 'Error logging the scan.', trustee };
    }

    // Step 4: Increment the scan count
    const { error: countError } = await supabase
        .from('trustees')
        .update({ daily_scan_count: trustee.daily_scan_count + 1 })
        .eq('id', trustee.id);

    if (countError) {
        return { success: false, message: 'Error updating scan count.', trustee };
    }

    return { success: true, trustee };
}

/**
 * Fetch all scan logs with trustee details (for Admin page).
 */
export async function fetchScanLogs() {
    const { data, error } = await supabase
        .from('scan_logs')
        .select(`
            id,
            scan_time,
            scanned_by,
            trustee:trustee_id (
                first_name,
                last_name,
                gaam
            )
        `)
        .order('scan_time', { ascending: false });

    if (error) {
        console.error('Error fetching logs:', error);
        return [];
    }

    return data;
}

/**
 * Fetch recent scan logs for a specific trustee (Mini Log on QR scanner page).
 */
export async function fetchScanLogsForTrustee(trusteeId) {
    const { data, error } = await supabase
        .from('scan_logs')
        .select('id, scan_time')
        .eq('trustee_id', trusteeId)
        .order('scan_time', { ascending: false })
        .limit(5); // Show last 5 scans

    if (error) {
        console.error('Error fetching mini log:', error);
        return [];
    }

    return data;
}
