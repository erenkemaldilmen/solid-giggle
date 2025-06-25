import { resolve } from 'path'
import { defineConfig } from 'vite'

// Bu satır, Vite'a ayarların başladığını söyler
export default defineConfig({
  
  // 'build' ayarları, 'npm run build' komutu çalıştığında kullanılır
  build: {
    rollupOptions: {
      // Bu bölüm, Vite'a projenizdeki tüm HTML dosyalarını tanıtır
      input: {
        main: resolve(__dirname, 'index.html'),
        textHumanizer: resolve(__dirname, 'text-humanizer.html'),
        features: resolve(__dirname, 'features.html'),
        pricing: resolve(__dirname, 'pricing.html'),

        // Eğer projenizin kök dizininde başka HTML dosyaları varsa,
        // onları da bu formata uygun şekilde buraya ekleyin.
        // Örnek:
        // about: resolve(__dirname, 'about.html'),
      },
    },
  },

  // Geliştirme sunucusu ayarları (opsiyonel ama iyi bir pratik)
  server: {
    open: true, // npm run dev dediğinizde tarayıcıyı otomatik açar
  }

}) // Bu satır, ayar nesnesinin bittiğini gösterir