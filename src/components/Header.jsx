import { useState, useRef, useEffect } from 'react';
import GoogleLogin from './GoogleLogin.jsx';
export default function Header(){
const [open,setOpen]=useState(false);const toggleRef=useRef(null);
useEffect(()=>{const onKey=(event)=>{if(event.key==='Escape'&&open){setOpen(false);toggleRef.current?.focus();}};document.addEventListener('keydown',onKey);return ()=>document.removeEventListener('keydown',onKey);},[open]);
return (<header><a className="brand" href="#" aria-label="용문동 홈"><img className="symbol" src="/images/logo.svg" alt="" loading="lazy" /><span>용문동<small>YONGMUN-DONG</small></span></a><button className="menu" aria-expanded={open} onClick={() => setOpen(!open)} ref={toggleRef} aria-controls="navigation">{open ? '닫기' : '메뉴'}</button><nav className={open ? "open" : ""} onClick={(event) => { if (event.target.closest("a")) setOpen(false); }} id="navigation" aria-label="주 메뉴"><a href="#about">마을 소개</a><a href="#scenery">마을의 풍경</a><a href="#stories">마을 이야기</a><a className="nav-visit" href="#visit">방문 안내 ↗</a><GoogleLogin /></nav></header>);
}

