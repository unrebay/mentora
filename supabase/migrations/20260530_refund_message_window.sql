-- C3: refund one free-tier message when AI generation fails after the counter
-- was already incremented. SECURITY DEFINER mirrors increment_messages_window
-- (messages_today is a protected column users cannot edit directly).
create or replace function public.refund_message_window(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.users
  set messages_today = greatest(coalesce(messages_today, 1) - 1, 0)
  where id = p_user_id;
end;
$$;

grant execute on function public.refund_message_window(uuid) to authenticated, service_role;
