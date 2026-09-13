import { useEffect, useMemo, useRef, useState } from 'react'
import comicData from './data/comics.json'
import pageRegistry from 'virtual:comic-pages'
import './App.css'

const comics = comicData.map((comic) => ({
  ...comic,
  pages: pageRegistry[comic.slug] || [],
}))

const paths = { search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, arrow:<path d="m15 18-6-6 6-6"/>, expand:<><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>, zoomIn:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4M10.5 7.5v6M7.5 10.5h6"/></>, zoomOut:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4M7.5 10.5h6"/></>, close:<path d="M6 6l12 12M18 6 6 18"/> }
function Icon({name,size=20}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg> }

function Artwork({comic,file='cover',className='',label}) {
  const [failed,setFailed]=useState(false)
  const src=file&&comic.extension?`/comics/${comic.slug}/${file}.${comic.extension}`:null
  if(!src||failed) return <div className={`art-placeholder ${className}`} aria-label={`${comic.title} artwork placeholder`}><span>{comic.title[0].toUpperCase()}</span></div>
  return <img className={className} src={src} alt={label||`${comic.title} cover`} onError={()=>setFailed(true)} draggable="false" onContextMenu={e=>e.preventDefault()}/>
}

function Header({onHome}) { return <header className="site-header"><button className="brand" onClick={onHome}><span className="brand-mark">I</span><span>INKSTONE</span></button><span className="header-rule"/><span className="header-note">Independent stories.<br/>Unforgettable worlds.</span></header> }

function Home({onSelect}) {
  const [query,setQuery]=useState('')
  const results=useMemo(()=>comics.filter(c=>`${c.title} ${c.genre}`.toLowerCase().includes(query.toLowerCase())),[query])
  return <main><section className="hero-section"><p className="eyebrow">THE READING ROOM</p><h1>Stories worth<br/><em>getting lost in.</em></h1><p className="hero-copy">A curated collection of independent comics, strange worlds, and stories that stay with you.</p><label className="search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by title or genre"/><kbd>⌘ K</kbd></label></section>
  <section className="library-section"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Browse the library</h2></div><span>{results.length} {results.length===1?'story':'stories'}</span></div><div className="comic-grid">{results.map((comic,i)=><article className="comic-card" key={comic.slug} onClick={()=>onSelect(comic)} tabIndex="0" onKeyDown={e=>e.key==='Enter'&&onSelect(comic)}><div className="cover-wrap"><Artwork comic={comic}/><span className="issue">{String(i+1).padStart(2,'0')}</span><span className="card-action"><Icon name="arrow"/></span></div><div className="card-meta"><span>{comic.genre}</span><span>{comic.year}</span></div><h3>{comic.title}</h3><p>{comic.tagline}</p></article>)}</div>{!results.length&&<div className="empty"><span>Ø</span><h3>No stories found</h3><p>Try another title or genre.</p></div>}</section></main>
}

function Detail({comic,onBack,onRead}) { return <main className="detail-page"><button className="back-link" onClick={onBack}><Icon name="arrow"/> Back to library</button><section className="comic-detail"><div className="detail-cover"><Artwork comic={comic}/><span className="vertical-label">INKSTONE ORIGINAL</span></div><div className="detail-copy"><p className="eyebrow">{comic.genre} · {comic.year}</p><h1>{comic.title}</h1><p className="tagline">{comic.tagline}</p><span className="accent-line"/><p className="synopsis">{comic.synopsis}</p><dl><div><dt>Written by</dt><dd>{comic.author}</dd></div><div><dt>Pages</dt><dd>{comic.pages.length}</dd></div><div><dt>Reading time</dt><dd>{comic.readingTime}</dd></div></dl><button className="primary-button" onClick={onRead}>Read this comic <Icon name="arrow"/></button></div></section><section className="preview-section"><div className="section-heading"><div><p className="eyebrow">A LOOK INSIDE</p><h2>Preview pages</h2></div><span>Selected from this issue</span></div><div className="preview-grid">{comic.preview.map(page=><div className="preview-page" key={page}><Artwork comic={comic} file={String(page)} label={`${comic.title}, page ${page}`}/><span>PAGE {String(page).padStart(2,'0')}</span></div>)}</div></section></main> }

function Reader({comic,onClose}) {
  const [page,setPage]=useState(0),[zoom,setZoom]=useState(1),[pan,setPan]=useState({x:0,y:0})
  const pointers=useRef(new Map()),gesture=useRef({})
  const resetView=()=>{setZoom(1);setPan({x:0,y:0})}
  const move=d=>{setPage(v=>Math.min(comic.pages.length-1,Math.max(0,v+d)));resetView()}
  const changeZoom=amount=>setZoom(value=>{const next=Math.min(4,Math.max(1,value+amount));if(next===1)setPan({x:0,y:0});return next})
  const distance=([a,b])=>Math.hypot(b.x-a.x,b.y-a.y)
  const center=([a,b])=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2})
  const beginGesture=()=>{const points=[...pointers.current.values()];gesture.current=points.length===2?{distance:distance(points),zoom,center:center(points),pan}:points.length===1?{point:points[0],pan}:{}}
  const pointerDown=e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});beginGesture()}
  const pointerMove=e=>{if(!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const points=[...pointers.current.values()];if(points.length===2){const next=Math.min(4,Math.max(1,gesture.current.zoom*distance(points)/gesture.current.distance)),at=center(points);setZoom(next);setPan(next===1?{x:0,y:0}:{x:gesture.current.pan.x+at.x-gesture.current.center.x,y:gesture.current.pan.y+at.y-gesture.current.center.y})}else if(points.length===1&&zoom>1)setPan({x:gesture.current.pan.x+points[0].x-gesture.current.point.x,y:gesture.current.pan.y+points[0].y-gesture.current.point.y})}
  const pointerUp=e=>{pointers.current.delete(e.pointerId);beginGesture()}
  useEffect(()=>{const key=e=>{if(e.key==='ArrowRight')setPage(v=>Math.min(comic.pages.length-1,v+1));if(e.key==='ArrowLeft')setPage(v=>Math.max(0,v-1));if(e.key==='Escape')onClose()};window.addEventListener('keydown',key);document.body.classList.add('reading');return()=>{window.removeEventListener('keydown',key);document.body.classList.remove('reading')}},[onClose,comic.pages.length])
  const fullscreen=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()
  return <div className="reader" onContextMenu={e=>e.preventDefault()}><div className="reader-top"><button className="reader-brand" onClick={onClose}><span className="brand-mark">I</span><span>{comic.title}</span></button><span className="reader-counter">{page+1} / {comic.pages.length}</span><div className="reader-tools"><button title="Zoom out" onClick={()=>changeZoom(-.25)}><Icon name="zoomOut"/></button><button title="Zoom in" onClick={()=>changeZoom(.25)}><Icon name="zoomIn"/></button><button title="Full screen" onClick={fullscreen}><Icon name="expand"/></button><button title="Close" onClick={onClose}><Icon name="close"/></button></div></div><button className="reader-arrow left" disabled={page===0} onClick={()=>move(-1)}><Icon name="arrow" size={28}/></button><div className={`reader-canvas ${zoom>1?'is-zoomed':''}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}><div style={{transform:`translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`}} className="reader-page"><Artwork comic={comic} file={String(comic.pages[page])} label={`${comic.title}, page ${comic.pages[page]}`}/></div></div><button className="reader-arrow right" disabled={page===comic.pages.length-1} onClick={()=>move(1)}><Icon name="arrow" size={28}/></button><div className="reader-progress"><span style={{width:`${(page+1)/comic.pages.length*100}%`}}/></div></div>
}

export default function App(){const[view,setView]=useState('home'),[selected,setSelected]=useState(null);const select=c=>{setSelected(c);setView('detail');window.scrollTo(0,0)};if(view==='reader')return <Reader comic={selected} onClose={()=>setView('detail')}/>;return <><Header onHome={()=>setView('home')}/>{view==='home'?<Home onSelect={select}/>:<Detail comic={selected} onBack={()=>setView('home')} onRead={()=>setView('reader')}/>}<footer><span>INKSTONE</span><p>Made for stories that deserve to be read.</p><span>© 2026</span></footer></>}
