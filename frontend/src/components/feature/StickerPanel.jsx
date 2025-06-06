import React from 'react';
import stickers from '../../data/stickers';

const StickerPanel = React.memo(({ onSelect }) => (
    <div className="sticker-panel absolute z-10 flex flex-wrap gap-3 p-3 bg-gray-800 bg-opacity-90 rounded-md shadow-md border border-gray-600 w-fit max-w-[300px] max-h-64 overflow-y-auto">
        {stickers.map((sticker) => (
            <img
                key={sticker.src}
                src={sticker.src}
                alt={sticker.alt}
                className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => onSelect(sticker.src)}
            />
        ))}
    </div>
));

export default StickerPanel;
