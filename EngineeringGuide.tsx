
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom} from 'jotai';
import {IsGuideOpenAtom} from './atoms';
import {useState} from 'react';

const GUIDE_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Başlangıç ve Temel Kullanım',
    icon: '🚀',
    color: 'blue',
    summary: 'SynthEngine Pro temel özellikleri ve arayüzü.',
    content: (
      <div className="space-y-3 text-sm">
        <p>SynthEngine Pro, gelişmiş yapay zeka modellerini kullanarak sentetik veri üretmenizi sağlayan bir platformdur.</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
          <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Temel İş Akışı:</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Üst menüden kullanmak istediğiniz <strong>Yapay Zeka Modelini</strong> seçin.</li>
            <li>Sol taraftaki araç çubuğunu kullanarak görüntü üzerinde işlem yapmak istediğiniz alanı seçin (veya tüm görüntüyü kullanın).</li>
            <li>Sağ panelden sektörünüzü ve özel ayarlarınızı yapılandırın.</li>
            <li>Alt kısımdaki metin kutusuna ne istediğinizi yazın ve <strong>Sentezle</strong> butonuna basın.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'dual-model',
    title: 'Dual Model Mode (A/B Testi)',
    icon: '⚖️',
    color: 'purple',
    summary: 'İki farklı AI modelini aynı anda karşılaştırın.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Farklı yapay zeka modellerinin aynı prompt'a nasıl tepki verdiğini görmek için <strong>Dual Model Mode</strong> kullanabilirsiniz.</p>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
          <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2">Nasıl Kullanılır?</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Sağ paneldeki (Ayarlar) <strong>Gelişmiş AI Özellikleri</strong> bölümünü açın.</li>
            <li><strong>Dual Model Mode (A/B Test)</strong> seçeneğini aktif edin.</li>
            <li>Karşılaştırmak istediğiniz ikinci modeli seçin.</li>
            <li>Sentezleme yaptığınızda ekran ikiye bölünecek ve her iki modelin sonucu yan yana gösterilecektir.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'advanced-masking',
    title: 'Gelişmiş Maskeleme (Inpainting)',
    icon: '🖌️',
    color: 'pink',
    summary: 'Görüntünün sadece belirli kısımlarını değiştirin.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Görüntünün tamamını değiştirmek yerine sadece belirli bir nesneyi veya alanı değiştirmek için maskeleme araçlarını kullanın.</p>
        <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg border border-pink-100 dark:border-pink-800">
          <h4 className="font-bold text-pink-700 dark:text-pink-400 mb-2">Maskeleme İpuçları:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Sol araç çubuğundan <strong>Fırça</strong>, <strong>Dikdörtgen</strong> veya <strong>Poligon</strong> aracını seçin.</li>
            <li>Değiştirmek istediğiniz alanı boyayın/seçin.</li>
            <li>Arka planı değiştirmek isterseniz araç çubuğundaki <strong>Maskeyi Ters Çevir (🌗)</strong> butonuna tıklayın.</li>
            <li>Promptunuzu yazın (örn: "Paslı hale getir" veya "Arka planı orman yap").</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'live-assistant',
    title: 'Canlı Asistan (Sesli Komut)',
    icon: '🎙️',
    color: 'green',
    summary: 'Yapay zeka asistanı ile konuşarak prompt oluşturun.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Prompt yazmak yerine, isteklerinizi doğrudan konuşarak yapay zekaya iletebilirsiniz. Asistan ayrıca ürettiğiniz görüntülerin kalitesini analiz edip size tavsiyelerde bulunur.</p>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
          <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">Özellikler:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Üst bardaki <strong>Sesli Asistan</strong> butonuna tıklayarak mikrofonunuzu açın.</li>
            <li>Ne yapmak istediğinizi söyleyin (örn: "Görüntüyü gece vaktine çevir ve yağmur ekle").</li>
            <li>Asistan söylediklerinizi anında prompt kutusuna yazacaktır.</li>
            <li>Görüntü ürettikten sonra asistan size kaliteyi artırmak için <strong>Yapay Zeka Önerisi</strong> sunacaktır.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'analytics',
    title: 'Gerçek Zamanlı Analitik',
    icon: '📊',
    color: 'orange',
    summary: 'Üretim kalitenizi ve trendleri takip edin.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Ürettiğiniz sentetik verilerin kalitesini zaman içinde izleyerek prompt mühendisliğinizin ne kadar başarılı olduğunu görebilirsiniz.</p>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
          <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-2">Analitik Paneli:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Üst bardaki <strong>📊 (Grafik)</strong> ikonuna tıklayarak Analitik Dashboard'u açın.</li>
            <li>Burada toplam üretim sayınızı, ortalama kalite puanınızı ve son üretiminizin puanını görebilirsiniz.</li>
            <li>Grafik üzerinden zaman içindeki kalite trendinizi inceleyerek hangi prompt stratejilerinin daha iyi sonuç verdiğini analiz edin.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'domain-gap',
    title: 'Domain Gap & Problem Tanımı',
    icon: '🌉',
    color: 'blue',
    summary: 'Modeliniz sahada neden başarısız oluyor?',
    content: (
      <div className="space-y-3 text-sm">
        <p>Modeliniz laboratuvar verileriyle eğitildiyse ancak sahada (kirli, paslı, karanlık ortamlarda) başarısız oluyorsa bir <strong>Domain Gap</strong> sorununuz vardır.</p>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
          <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Çözüm Adımları:</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>İş İstasyonu Modu</strong>'ndan sektörünüzü (örn. Üretim) seçin.</li>
            <li>Temiz/İdeal bir parça görüntüsü yükleyin.</li>
            <li><strong>Kusur Simülasyonu</strong> menüsünden 'Pas', 'Çizik' veya 'Korozyon' seçin.</li>
            <li><strong>Işıklandırma</strong> ayarını 'Düşük Işık' veya 'Neon' yaparak fabrika ortamını simüle edin.</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'data-dreamer',
    title: 'DataDreamer (LLM Prompting)',
    icon: '💭',
    color: 'indigo',
    summary: 'LLM ile otomatik veri çeşitlendirme.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Luxonis DataDreamer felsefesine dayanarak; tek bir statik prompt yazmak yerine, LLM'e (Gemini) bir "kavram" verip ondan yüzlerce varyasyon üretmesini isteyebilirsiniz.</p>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
          <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-2">Nasıl Çalışır?</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Sektör menüsünden <strong>DataDreamer</strong> sekmesine geçin.</li>
            <li>Bir <strong>Nesne</strong> (örn. "İngiliz Anahtarı") ve bir <strong>Bağlam</strong> (örn. "Dağınık Atölye Masası") girin.</li>
            <li><strong>Hayal Et</strong> butonuna basın.</li>
            <li>Sistem sizin için otomatik olarak ışık, açı ve durum (kirli, yeni, yağlı) varyasyonları içeren 5 farklı profesyonel prompt üretecektir.</li>
            <li>Bu promptları sırayla kullanarak çok çeşitli bir veri seti oluşturabilirsiniz.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'red-team',
    title: 'Red Team / Adversarial Testing',
    icon: '🚨',
    color: 'red',
    summary: 'Modelinizi bilerek kırmaya çalışın.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Modelinizin sınırlarını görmek için ona "kötü niyetli" veya aşırı zorlayıcı örnekler sunmalısınız. Bu, savunmasızlıkları tespit eder.</p>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Saldırı Vektörleri:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>Kamuflaj:</strong> Nesneyi arka planla aynı dokuda üreterek modelin sınırlarını (edge detection) test edin.</li>
            <li><strong>Oklüzyon:</strong> Nesnenin %70-80'ini gizleyerek modelin tahmin yeteneğini zorlayın.</li>
            <li><strong>Adversarial Patch:</strong> Nesne üzerine yapay zekayı şaşırtacak geometrik desenler (dama tahtası vb.) ekleyin.</li>
            <li><strong>Kullanım:</strong> Sektör menüsünden 'Red Team' seçeneğini aktif edin.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'roi-inpainting',
    title: 'ROI ve Hedefli Veri Üretimi',
    icon: '🎯',
    color: 'red',
    summary: 'Veriyi kirletmeden sadece hedefi değiştirin.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Tüm görüntüyü değiştirmek arka plan bağlamını bozabilir. Computer Vision modelleri için arka planın (background context) tutarlılığı kritiktir.</p>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
          <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">Mühendislik Stratejisi:</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Sol araç çubuğundan <strong>Fırça</strong> veya <strong>Poligon</strong> aracını alın.</li>
            <li>Sadece değiştirmek istediğiniz nesneyi (örn. vida başı, yaprak) maskeleyin.</li>
            <li>Arka plan %100 orijinal kalırken, prompt ile sadece maskelenmiş alana müdahale edin (örn. "Stripped screw head").</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'class-imbalance',
    title: 'Sınıf Dengesizliği (Imbalance)',
    icon: '⚖️',
    color: 'purple',
    summary: '%1\'lik nadir hataları çoğaltın.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Gerçek hayatta %99 "Normal", %1 "Hatalı" veri bulunur. Modeliniz hatalı ürünleri hiç görmediği için tanıyamaz.</p>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
          <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-2">Dengeleme İş Akışı:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Elinizdeki 1 adet nadir örneği yükleyin veya normal bir örneği kullanın.</li>
            <li>Sektör kontrollerinden nadir durumu seçin (örn. Tarım &rarr; Azot Eksikliği).</li>
            <li><strong>Batch Count</strong> ayarını 8'e getirin.</li>
            <li>Tek seferde 8 farklı varyasyon üreterek veri setinizdeki azınlık sınıfı zenginleştirin.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'domain-randomization',
    title: 'Domain Randomization',
    icon: '🎲',
    color: 'green',
    summary: 'Model dayanıklılığı (Robustness) için ortamı değiştirin.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Modeliniz sadece güneşli havalarda çalışıyorsa, "Overfitting" (aşırı öğrenme) sorunu yaşıyorsunuz demektir.</p>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
          <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">Varyasyon Teknikleri:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li><strong>Güvenlik Modu</strong>'na geçin.</li>
            <li>Aynı sahneyi; Gece, Sisli, Yağmurlu olarak tekrar üretin.</li>
            <li><strong>Kamera Modu</strong>'nu 'Termal' veya 'IR' yaparak sensör gürültüsü (sensor noise) ekleyin.</li>
            <li>Bu sentetik verilerle eğitilen model, ışık değişimlerinden etkilenmez.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'qa-export',
    title: 'Kalite Kontrol & İhracat',
    icon: '✅',
    color: 'orange',
    summary: 'Human-in-the-loop (İnsan Döngüde) yaklaşımı.',
    content: (
      <div className="space-y-3 text-sm">
        <p>Her sentetik veri eğitim için uygun değildir. Halüsinasyonları filtrelemeniz gerekir.</p>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
          <h4 className="font-bold text-orange-700 dark:text-orange-400 mb-2">Doğrulama Adımları:</h4>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Üretim sonrası sağ üstteki <strong>AI Kalite Puanı</strong>'na bakın.</li>
            <li>80 puan altındaki veya fiziksel olarak imkansız görünen verileri eleyin.</li>
            <li>Geçmiş (History) panelinden <strong>Export to YOLO</strong> diyerek verileri etiketleriyle birlikte indirin.</li>
          </ol>
        </div>
      </div>
    )
  }
];

export function EngineeringGuide() {
  const [isOpen, setIsOpen] = useAtom(IsGuideOpenAtom);
  const [activeTab, setActiveTab] = useState(GUIDE_SECTIONS[0].id);

  if (!isOpen) return null;

  const activeContent = GUIDE_SECTIONS.find(s => s.id === activeTab);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative bg-white dark:bg-[#121212] w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-1/3 min-w-[250px] bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Eğitimler ve Rehberler</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Özellikler ve Stratejiler</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {GUIDE_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left p-4 rounded-xl transition-all border-2 flex items-start gap-3 group ${
                  activeTab === section.id 
                    ? `bg-white dark:bg-black border-${section.color}-500 shadow-md` 
                    : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{section.icon}</span>
                <div>
                  <div className={`text-sm font-bold ${activeTab === section.id ? `text-${section.color}-600` : 'text-gray-700 dark:text-gray-300'}`}>
                    {section.title}
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight mt-1 line-clamp-2">
                    {section.summary}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-xl font-bold bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors text-xs uppercase tracking-wider"
            >
              Rehberi Kapat
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#121212] relative overflow-hidden">
          {activeContent && (
            <>
              {/* Header Image/Banner Area (Abstract) */}
              <div className={`h-32 w-full bg-gradient-to-r from-${activeContent.color}-500/10 to-${activeContent.color}-500/5 flex items-end p-8 border-b border-gray-100 dark:border-gray-800`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-${activeContent.color}-100 dark:bg-${activeContent.color}-900/30 flex items-center justify-center text-4xl shadow-inner`}>
                    {activeContent.icon}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{activeContent.title}</h1>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${activeContent.color}-100 text-${activeContent.color}-700`}>
                      Senaryo #{GUIDE_SECTIONS.findIndex(s => s.id === activeTab) + 1}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Text Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="prose dark:prose-invert max-w-none">
                  {activeContent.content}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">İlgili Araçlar</h4>
                  <div className="flex gap-3">
                    {activeTab === 'domain-gap' && (
                       <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono">Input Panel &gt; Sektör Seçimi</div>
                    )}
                    {activeTab === 'roi-inpainting' && (
                       <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono">Araç Çubuğu &gt; Maskeleme</div>
                    )}
                     <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-mono">Prompt: "{activeContent.title}..."</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
