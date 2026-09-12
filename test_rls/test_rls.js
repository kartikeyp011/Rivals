const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const report = {
  participant_arena_access: 'FAIL',
  non_participant_arena_rejection: 'FAIL',
  questions_safe_protection: 'FAIL',
  direct_questions_protection: 'FAIL',
  authenticated_write_rejection: 'FAIL',
  coin_ledger_protection: 'FAIL',
  attempt_visibility: 'FAIL',
  realtime_rls: 'FAIL',
  updated_at_trigger: 'FAIL',
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('Starting validation tests...');
  try {
    // 1. Create Test Users
    console.log('Creating test users...');
    const users = [];
    const timestamp = Date.now();
    for (let i = 1; i <= 3; i++) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: `player${i}_${timestamp}@example.com`,
        password: 'password123',
        email_confirm: true,
      });
      if (error) throw error;
      users.push({ ...data.user, email: `player${i}_${timestamp}@example.com` });
    }
    const [p1, p2, p3] = users;

    // Create clients for each user
    const createClientForUser = async (email, password) => {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return client;
    };

    const clientP1 = await createClientForUser(p1.email, 'password123');
    const clientP2 = await createClientForUser(p2.email, 'password123');
    const clientP3 = await createClientForUser(p3.email, 'password123');

    // 2. Setup initial profiles using admin
    await supabaseAdmin.from('profiles').insert([
      { id: p1.id, username: 'player1' },
      { id: p2.id, username: 'player2' },
      { id: p3.id, username: 'player3' }
    ]);
    
    // Give p1 some coins
    await supabaseAdmin.from('coin_ledger').insert([
      { user_id: p1.id, type: 'credit', reason: 'admin_adjustment', amount: 1000, balance_after: 1000 }
    ]);

    // 3. Verify users cannot modify coin balances (profiles has no coin_balance - already verified schema)
    const { error: ledgerWriteErr } = await clientP1.from('coin_ledger').insert([
      { user_id: p1.id, type: 'credit', reason: 'admin_adjustment', amount: 1000, balance_after: 2000 }
    ]);
    const { data: ledgerP1 } = await clientP1.from('coin_ledger').select('*');
    const { data: ledgerP2 } = await clientP2.from('coin_ledger').select('*');
    
    if (ledgerWriteErr && ledgerP1.length === 1 && ledgerP2.length === 0) {
      report.coin_ledger_protection = 'PASS';
    } else {
      console.log('Coin Ledger Failure:', ledgerWriteErr, ledgerP1, ledgerP2);
    }

    // 4. Setup Test Arena
    const { data: arenaData, error: arenaErr } = await supabaseAdmin.from('arenas').insert([
      { host_user_id: p1.id, status: 'active', max_participants: 2, max_rounds: 1 }
    ]).select().single();
    if (arenaErr) throw arenaErr;
    const arenaId = arenaData.id;

    await supabaseAdmin.from('arena_participants').insert([
      { arena_id: arenaId, user_id: p1.id, status: 'active' },
      { arena_id: arenaId, user_id: p2.id, status: 'active' }
    ]);

    // 5. Test Arena participant vs non-participant access
    const { data: aP1, error: aP1Err } = await clientP1.from('arenas').select('*').eq('id', arenaId);
    const { data: aP3, error: aP3Err } = await clientP3.from('arenas').select('*').eq('id', arenaId);
    if (!aP1Err && !aP3Err && aP1 && aP1.length === 1 && aP3 && aP3.length === 0) {
      report.participant_arena_access = 'PASS';
      report.non_participant_arena_rejection = 'PASS';
    } else {
      console.log('Arena Access Failure:', aP1Err, aP1, aP3Err, aP3);
    }

    // 6. Test updated_at trigger on arenas
    const initialUpdatedAt = arenaData.updated_at;
    await sleep(1000); // wait a sec to ensure timestamp changes
    await supabaseAdmin.from('arenas').update({ status: 'completed' }).eq('id', arenaId);
    const { data: arenaDataUpdated } = await supabaseAdmin.from('arenas').select('*').eq('id', arenaId).single();
    if (arenaDataUpdated.updated_at !== initialUpdatedAt) {
      report.updated_at_trigger = 'PASS';
    } else {
      console.log('Updated At Trigger Failure:', initialUpdatedAt, arenaDataUpdated.updated_at);
    }
    // Revert status for further tests
    await supabaseAdmin.from('arenas').update({ status: 'active' }).eq('id', arenaId);

    // 7. Verify questions_safe security
    const { data: qSafe, error: qSafeErr } = await clientP1.from('questions_safe').select('*').limit(1);
    const { data: qDirect, error: qDirectErr } = await clientP1.from('questions').select('*').limit(1);
    const { data: qAdmin } = await supabaseAdmin.from('questions').select('*').limit(1);

    if (!qSafeErr && qSafe && qSafe.length > 0 && !('correct_option' in qSafe[0])) {
      report.questions_safe_protection = 'PASS';
    } else {
      console.log('Questions Safe Failure:', qSafeErr, qSafe);
    }

    if (qDirectErr || !qDirect || qDirect.length === 0) {
      report.direct_questions_protection = 'PASS';
    } else {
      console.log('Direct Questions Failure:', qDirectErr, qDirect);
    }

    // 8. Verify authenticated users cannot write arena data
    const { error: writeArenaErr } = await clientP1.from('arenas').insert([
      { host_user_id: p1.id, status: 'pending' }
    ]);
    if (writeArenaErr) {
      report.authenticated_write_rejection = 'PASS';
    } else {
      console.log('Authenticated Write Failure:', writeArenaErr);
    }

    // 9. Test arena_attempts visibility
    // Add a round and attempts
    const { data: roundData } = await supabaseAdmin.from('arena_rounds').insert([
      { arena_id: arenaId, question_id: qAdmin[0].id, round_number: 1, status: 'active' }
    ]).select().single();

    await supabaseAdmin.from('arena_attempts').insert([
      { arena_id: arenaId, round_id: roundData.id, user_id: p1.id, status: 'in_progress' },
      { arena_id: arenaId, round_id: roundData.id, user_id: p2.id, status: 'in_progress' }
    ]);

    const { data: attemptsP1_active, error: errP1_active } = await clientP1.from('arena_attempts').select('*').eq('round_id', roundData.id);
    const { data: attemptsP2_active, error: errP2_active } = await clientP2.from('arena_attempts').select('*').eq('round_id', roundData.id);

    await supabaseAdmin.from('arena_rounds').update({ status: 'completed' }).eq('id', roundData.id);

    const { data: attemptsP1_completed, error: errP1_completed } = await clientP1.from('arena_attempts').select('*').eq('round_id', roundData.id);
    const { data: attemptsP3_completed, error: errP3_completed } = await clientP3.from('arena_attempts').select('*').eq('round_id', roundData.id);

    if (!errP1_active && !errP2_active && !errP1_completed && !errP3_completed &&
        attemptsP1_active && attemptsP1_active.length === 1 && attemptsP1_active[0].user_id === p1.id &&
        attemptsP2_active && attemptsP2_active.length === 1 && attemptsP2_active[0].user_id === p2.id &&
        attemptsP1_completed && attemptsP1_completed.length === 2 && 
        attemptsP3_completed && attemptsP3_completed.length === 0) {
      report.attempt_visibility = 'PASS';
    } else {
      console.log('Attempt Visibility Failure:', errP1_active, attemptsP1_active, errP2_active, attemptsP2_active, errP1_completed, attemptsP1_completed, errP3_completed, attemptsP3_completed);
    }

    // 10. Test Realtime + RLS for arena_attempts
    // We will do this by subscribing clientP1 and having admin update P1's attempt and P2's attempt
    await supabaseAdmin.from('arena_rounds').update({ status: 'active' }).eq('id', roundData.id);
    
    let receivedP1 = 0;
    let receivedP2 = 0;
    
    // Setup realtime subscription
    const channel = clientP1.channel('db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_attempts' }, payload => {
        if (payload.new.user_id === p1.id) receivedP1++;
        if (payload.new.user_id === p2.id) receivedP2++;
      })
      .subscribe();

    await sleep(2000); // Wait for subscription to establish

    await supabaseAdmin.from('arena_attempts').update({ status: 'submitted' }).eq('user_id', p2.id);
    await sleep(1000);
    await supabaseAdmin.from('arena_attempts').update({ status: 'submitted' }).eq('user_id', p1.id);
    await sleep(2000); // Wait for events

    if (receivedP1 > 0 && receivedP2 === 0) {
      report.realtime_rls = 'PASS';
    } else {
      console.log('Realtime RLS Failure: receivedP1=', receivedP1, 'receivedP2=', receivedP2);
    }
    
    supabaseAdmin.removeChannel(channel);

  } catch (err) {
    console.error('Test error:', err);
  }

  console.log('\n--- FINAL REPORT ---');
  console.log(JSON.stringify(report, null, 2));
}

runTests();
