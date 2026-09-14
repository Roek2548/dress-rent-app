import { createClient } from '@supabase/supabase-js'

// ไปเอา URL และ Anon Key มาจากหน้า Project Settings -> API ในเว็บ Supabase
const supabaseUrl = 'https://rgywzuignvwhnulglwpp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneXd6dWlnbnZ3aG51bGdsd3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDY0MjcsImV4cCI6MjA4NTc4MjQyN30.0dmFqtVOr1gSLwa3hr_S7htp9Kd8K2aQX99GQ3ShudY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)