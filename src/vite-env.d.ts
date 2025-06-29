/// <reference types="vite/client" />
// src/vite-env.d.ts veya src/global.d.ts dosyasının içeriği

// Mevcut içerik varsa, altına ekleyin.
// Eğer dosya boşsa, direkt yapıştırın.

declare global {
    interface Window {
        LemonSqueezy?: { // '?' ile opsiyonel yaptık, her sayfada olmayabilir
            Url?: {
                Open: (url: string) => void;
            };
            Setup?: (options: { event_handler?: (event: any) => void }) => void;
        };
    }
}

// TypeScript'in bu dosyayı modül olarak değil, global bir script olarak görmesi için
// boş bir export ekleyebiliriz. Bu genellikle `tsconfig.json` ayarlarına bağlıdır.
export {};