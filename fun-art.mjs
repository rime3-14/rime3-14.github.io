// Original uploads stay unmodified. SVG viewports frame the artwork, while
// paper-backed drawings blend into the page instead of appearing as rectangles.
const artwork = {
 mirror: {size:[735,919], crop:[230,258,240,360], ink:true},
 camera: {size:[1200,1200], crop:[230,276,750,555], ink:true},
 crayon: {size:[301,301], crop:[36,62,221,161], ink:true},
 postcard: {size:[1200,1200], crop:[200,280,800,600], ink:true},
 elsewhere: {size:[671,720], crop:[0,0,671,720]},
 'photo-frame': {size:[960,1155], crop:[100,125,750,930], ink:true}
};
export function suppliedArt(name, className='') {
 const art=artwork[name];
 if(!art)return `<img class="supplied-art ${className}" src="../assets/fun/${name}.webp" alt="" draggable="false">`;
 const id=`ink-${name}-${className.replace(/\s+/g,'-')}`;
 return `<svg class="supplied-art ${className}" viewBox="${art.crop.join(' ')}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${art.ink?`<defs><filter id="${id}" x="0" y="0" width="${art.size[0]}" height="${art.size[1]}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.15"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>`:''}<image href="../assets/fun/${name}.webp" width="${art.size[0]}" height="${art.size[1]}"${art.ink?` filter="url(#${id})"`:''}/></svg>`;
}
export const doorArtwork={portrait:'mirror',photos:'camera',bag:'door-bag',sketch:'crayon',travels:'postcard',links:'elsewhere'};
export const bagArtwork={gloss:'gloss',earphones:'earphones',charm:'charm',gum:'gum',notebook:'notebook',glasses:'glasses',photos:'photo-frame',receipt:'receipt'};
