import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zxxkutexabspjiwghsvn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eGt1dGV4YWJzcGppd2doc3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYwNzMsImV4cCI6MjA2ODM3MjA3M30.us8-BQW50RsdhMfMtTPnTshexKBBv7qisCB6sSQEMQk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)