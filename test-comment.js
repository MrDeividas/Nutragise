const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommentFunctionality() {
  console.log('Testing comment functionality...');
  
  try {
    // Test if the RPC function exists
    const { data, error } = await supabase.rpc('get_goal_comment_count', {
      goal_id_param: 'test-goal-id'
    });
    
    if (error) {
      console.log('Error testing comment count function:', error);
    } else {
      console.log('Comment count function works:', data);
    }
  } catch (error) {
    console.log('Error testing comment functionality:', error);
  }
}

testCommentFunctionality(); 