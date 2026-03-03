import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskFlow() {
    console.log('Testing Task Creation...');

    // You need a valid user ID for auth policies. 
    // We'll fetch the first user in the DB or bypass if we can.
    // Actually, we can authenticate using the tester account:
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'tester@example.com',
        password: 'password123',
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    const userId = authData.user?.id;
    console.log('User signed in:', userId);

    const newTask = {
        user_id: userId,
        title: 'Server Test Task',
        status: 'To Do',
        priority: 'Medium',
        is_recurring: false
    };

    const { data: createData, error: createError } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();

    if (createError) {
        console.error('Create error:', createError);
        return;
    }

    const createdTask = createData[0];
    console.log('Successfully created task:', createdTask);

    console.log('Testing Task Deletion...');
    const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', createdTask.id);

    if (deleteError) {
        console.error('Delete error:', deleteError);
    } else {
        console.log('Successfully deleted task:', createdTask.id);
    }
}

testTaskFlow();
