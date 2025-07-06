// src/utils/api.js
import { supabase } from '../services/supabaseClient';

// Validate QR code and check family scan limit
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
            return { success: false, message: 'Error resetting daily count.' };
        }

        // Refresh trustee data
        trustee.daily_scan_count = 0;
        trustee.last_scan_date = today;
    }

    if (trustee.daily_scan_count >= trustee.family_size_limit) {
        return { success: false, message: 'Daily scan limit reached.' };
    }

    // Step 3: Log the scan
    const { error: logError } = await supabase.from('scan_logs').insert([
        { trustee_id: trustee.id }
    ]);

    if (logError) {
        return { success: false, message: 'Error logging the scan.' };
    }

    // Step 4: Increment the scan count
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
