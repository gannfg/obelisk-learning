import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for auth database
const supabaseUrl = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_OBELISK_LEARNING_AUTH_SUPABASE_ANON_KEY!;

// Create Supabase client for webhook operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sync Clerk user to Supabase
async function syncUserToSupabase(clerkUser: any) {
  try {
    // Extract email from Clerk user data
    let email = '';
    
    // Try primary email first
    if (clerkUser.primary_email_address_id && clerkUser.email_addresses) {
      const primaryEmail = clerkUser.email_addresses.find((e: any) => e.id === clerkUser.primary_email_address_id);
      if (primaryEmail?.email_address) {
        email = primaryEmail.email_address;
      }
    }
    
    // Fallback to first email
    if (!email && clerkUser.email_addresses?.[0]?.email_address) {
      email = clerkUser.email_addresses[0].email_address;
    }

    if (!email) {
      console.error('❌ No email found in Clerk user data');
      return false;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: clerkUser.id,
        email: email,
        username: clerkUser.username || null,
        first_name: clerkUser.first_name || null,
        last_name: clerkUser.last_name || null,
        image_url: clerkUser.image_url || null,
        created_at: new Date(clerkUser.created_at).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Failed to sync user to Supabase:', error);
      return false;
    }

    console.log('✅ User synced to Supabase via webhook', {
      userId: clerkUser.id,
      email: email,
      username: clerkUser.username || 'N/A'
    });
    return true;
  } catch (error) {
    console.error('❌ Error syncing user:', error);
    return false;
  }
}

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your .env.local');
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const clerkUser = evt.data;

  console.log(`📥 Received Clerk webhook: ${eventType}`, {
    userId: clerkUser?.id,
    email: clerkUser?.email_addresses?.[0]?.email_address
  });

  // Handle different event types
  switch (eventType) {
    case 'user.created':
    case 'user.updated':
      // Sync user to Supabase
      await syncUserToSupabase(clerkUser);
      break;

    case 'user.deleted':
      // Optionally handle user deletion
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', clerkUser.id);

        if (error) {
          console.error('❌ Failed to delete user from Supabase:', error);
        } else {
          console.log('✅ User deleted from Supabase', { userId: clerkUser.id });
        }
      } catch (error) {
        console.error('❌ Error deleting user:', error);
      }
      break;

    default:
      console.log(`⚠️ Unhandled webhook event type: ${eventType}`);
  }

  return new Response('Webhook received', { status: 200 });
}

