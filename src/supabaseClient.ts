// src/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Vite, import.meta.env aracılığıyla .env dosyasındaki değişkenlere erişir.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Eğer değişkenler .env dosyasında tanımlanmamışsa, hata vererek uygulamayı durdur.
// Bu, "Invalid API key" hatasıyla saatlerce uğraşmayı engeller.
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined in the .env file");
}

// Supabase client'ı burada SADECE BİR KEZ oluşturuluyor...
export const supabase = createClient(supabaseUrl, supabaseAnonKey);