
import React, { useState, useRef } from 'react';
import { Maximize2, X, Play, Plus, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { Photo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { compressImage, fileToBase64 } from '../utils/imageUtils';

const Gallery: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { gallery, addToGallery, removeFromGallery } = useContent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const type = file.type.startsWith('video') ? 'video' : 'image';
        
        try {
            let processedUrl = '';
            if (type === 'image') {
              // Store original image (no compression) so the full-quality image is shown
              processedUrl = await compressImage(file, { keepOriginal: true });
            } else {
              processedUrl = await fileToBase64(file);
            }

            const newPhoto: Photo = {
                id: Date.now().toString(),
                url: processedUrl,
                alt: '', // Empty default
                category: 'lifestyle',
                type: type,
                transform: { x: 0, y: 0, scale: 1 }
            };
            addToGallery(newPhoto);
            // No editor opening, just done.

        } catch (e) {
            console.error(e);
            alert("File too large to save in browser storage.");
        }
    }
  };

  // Captions removed by request — keep alt minimal

  return (
    <section id="gallery" className="py-24 bg-[#0f0f0f] relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 border-l-2 border-tennis-green pl-6 flex justify-between items-end">
            <div>
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">{t.gallery.title}</h2>
                <p className="text-gray-400 font-light">{t.gallery.subtitle}</p>
            </div>
            {isAuthenticated && (
                <div className="hidden md:block">
                     <span className="text-tennis-green text-xs font-bold uppercase tracking-widest border border-tennis-green/30 px-3 py-1 rounded-full animate-pulse">
                        Admin Mode Active
                     </span>
                </div>
            )}
        </div>

        {/* Square Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Admin Upload Tile */}
          {isAuthenticated && (
            <div 
                className="relative group border-2 border-dashed border-gray-700 rounded-sm hover:border-tennis-green transition-colors cursor-pointer flex flex-col items-center justify-center gap-4 bg-[#1a1a1a] aspect-square"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="w-16 h-16 rounded-full bg-gray-800 group-hover:bg-tennis-green group-hover:text-black flex items-center justify-center transition-colors">
                    <Plus className="w-8 h-8" />
                </div>
                <span className="text-gray-400 font-bold uppercase tracking-widest text-sm group-hover:text-white">
                    {t.gallery.add}
                </span>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                />
            </div>
          )}

          {gallery.map((photo) => {
            const transformStyle = photo.transform 
                ? { transform: `translate(${photo.transform.x}px, ${photo.transform.y}px) scale(${photo.transform.scale})` }
                : undefined;
            
            const caption = '';
            const hasCaption = false;

            return (
              <div 
                key={photo.id}
                className="relative group overflow-hidden rounded-sm cursor-pointer aspect-square bg-[#1a1a1a]"
                onClick={() => setSelectedPhoto(photo)}
              >
                {photo.type === 'video' ? (
                     <div className="w-full h-full relative overflow-hidden">
                        <video 
                            src={photo.url} 
                            className={`w-full h-full object-cover transition-all duration-700 origin-center`}
                            style={transformStyle}
                            muted
                            loop
                            playsInline
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => e.currentTarget.pause()}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur rounded-full flex items-center justify-center border border-white/20 pointer-events-none group-hover:scale-110 transition-transform z-10">
                            <Play className="w-5 h-5 text-white fill-white ml-1" />
                        </div>
                     </div>
                ) : (
                    <div className="w-full h-full overflow-hidden">
                        <img
                        src={photo.url}
                        alt={caption}
                        className={`w-full h-full object-cover transition-all duration-700 origin-center`}
                        style={transformStyle}
                        />
                    </div>
                )}
                
                {/* Descriptions removed — no overlay */}

                {/* Admin Controls - Delete Only */}
                {isAuthenticated && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
                        <button 
                            className="bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm('Delete this item?')) removeFromGallery(photo.id);
                            }}
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <button 
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-50"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center">
             {selectedPhoto.type === 'video' ? (
                 <video 
                    src={selectedPhoto.url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-[80vh] shadow-2xl shadow-black outline-none"
                 />
             ) : (
                <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.alt || ''}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl shadow-black"
                />
             )}
            
            {/* Descriptions removed from lightbox as requested */}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
