// src/utils/api.js
import { supabase } from '../services/supabaseClient';

/**
 * Validate the QR code, check family scan limits, log the scan, and update counts.
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

    // Step 2: Check and reset daily scan count if needed
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const lastScanDate = trustee.last_scan_date ? trustee.last_scan_date.split('T')[0] : null;

    if (lastScanDate !== today) {
        // Reset daily scan count for a new day
        const { error: updateError } = await supabase
            .from('trustees')
            .update({ daily_scan_count: 0, last_scan_date: today })
            .eq('id', trustee.id);

        if (updateError) {
            return { success: false, message: 'Error resetting daily count.' };
        }

        // Also update the local object
        trustee.daily_scan_count = 0;
        trustee.last_scan_date = today;
    }

    // Step 3: Check if family scan limit is reached
    if (trustee.daily_scan_count >= trustee.family_size_limit) {
        return { success: false, message: 'Daily scan limit reached.' };
    }

    // Step 4: Log the scan
    const { error: logError } = await supabase.from('scan_logs').insert([
        { trustee_id: trustee.id }
    ]);

    if (logError) {
        return { success: false, message: 'Error logging the scan.' };
    }

    // Step 5: Increment the daily scan count
    const { error: countError } = await supabase
        .from('trustees')
        .update({ daily_scan_count: trustee.daily_scan_count + 1 })
        .eq('id', trustee.id);

    if (countError) {
        return { success: false, message: 'Error updating scan count.' };
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
 * Fetch recent scan logs for a specific trustee (Mini Log).
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
