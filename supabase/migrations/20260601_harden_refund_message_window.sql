-- Only the service_role client (api/chat/route.ts) calls refund_message_window.
-- Lock down so anon/authenticated cannot reset another user's free-message window
-- via /rest/v1/rpc. (Audit 2026-06-01, finding 4.4.)
REVOKE EXECUTE ON FUNCTION public.refund_message_window(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.refund_message_window(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_message_window(uuid) FROM public;
GRANT  EXECUTE ON FUNCTION public.refund_message_window(uuid) TO service_role;
