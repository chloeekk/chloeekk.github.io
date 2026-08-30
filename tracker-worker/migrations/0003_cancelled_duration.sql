UPDATE time_entries
   SET ended_at_ms = COALESCE(ended_at_ms, cancelled_at_ms),
       calculated_duration_seconds = MAX(
         0,
         CAST((
           cancelled_at_ms - started_at_ms - COALESCE((
             SELECT SUM(COALESCE(p.resumed_at_ms, cancelled_at_ms) - p.paused_at_ms)
               FROM time_entry_pauses p
              WHERE p.time_entry_id = time_entries.id
           ), 0)
         ) / 1000 AS INTEGER)
       )
 WHERE status = 'cancelled'
   AND source = 'timer'
   AND started_at_ms IS NOT NULL
   AND cancelled_at_ms IS NOT NULL
   AND calculated_duration_seconds IS NULL;
