var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,a)=>(a=n==null?{}:e(i(n)),s(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n));(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var l=o((e=>{var t=Symbol.for(`react.transitional.element`),n=Symbol.for(`react.portal`),r=Symbol.for(`react.fragment`),i=Symbol.for(`react.strict_mode`),a=Symbol.for(`react.profiler`),o=Symbol.for(`react.consumer`),s=Symbol.for(`react.context`),c=Symbol.for(`react.forward_ref`),l=Symbol.for(`react.suspense`),u=Symbol.for(`react.memo`),d=Symbol.for(`react.lazy`),f=Symbol.for(`react.activity`),p=Symbol.iterator;function m(e){return typeof e!=`object`||!e?null:(e=p&&e[p]||e[`@@iterator`],typeof e==`function`?e:null)}var h={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},g=Object.assign,_={};function v(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}v.prototype.isReactComponent={},v.prototype.setState=function(e,t){if(typeof e!=`object`&&typeof e!=`function`&&e!=null)throw Error(`takes an object of state variables to update or a function which returns an object of state variables.`);this.updater.enqueueSetState(this,e,t,`setState`)},v.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,`forceUpdate`)};function y(){}y.prototype=v.prototype;function b(e,t,n){this.props=e,this.context=t,this.refs=_,this.updater=n||h}var x=b.prototype=new y;x.constructor=b,g(x,v.prototype),x.isPureReactComponent=!0;var S=Array.isArray;function C(){}var w={H:null,A:null,T:null,S:null},ee=Object.prototype.hasOwnProperty;function T(e,n,r){var i=r.ref;return{$$typeof:t,type:e,key:n,ref:i===void 0?null:i,props:r}}function te(e,t){return T(e.type,t,e.props)}function E(e){return typeof e==`object`&&!!e&&e.$$typeof===t}function D(e){var t={"=":`=0`,":":`=2`};return`$`+e.replace(/[=:]/g,function(e){return t[e]})}var ne=/\/+/g;function re(e,t){return typeof e==`object`&&e&&e.key!=null?D(``+e.key):t.toString(36)}function ie(e){switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:switch(typeof e.status==`string`?e.then(C,C):(e.status=`pending`,e.then(function(t){e.status===`pending`&&(e.status=`fulfilled`,e.value=t)},function(t){e.status===`pending`&&(e.status=`rejected`,e.reason=t)})),e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason}}throw e}function ae(e,r,i,a,o){var s=typeof e;(s===`undefined`||s===`boolean`)&&(e=null);var c=!1;if(e===null)c=!0;else switch(s){case`bigint`:case`string`:case`number`:c=!0;break;case`object`:switch(e.$$typeof){case t:case n:c=!0;break;case d:return c=e._init,ae(c(e._payload),r,i,a,o)}}if(c)return o=o(e),c=a===``?`.`+re(e,0):a,S(o)?(i=``,c!=null&&(i=c.replace(ne,`$&/`)+`/`),ae(o,r,i,``,function(e){return e})):o!=null&&(E(o)&&(o=te(o,i+(o.key==null||e&&e.key===o.key?``:(``+o.key).replace(ne,`$&/`)+`/`)+c)),r.push(o)),1;c=0;var l=a===``?`.`:a+`:`;if(S(e))for(var u=0;u<e.length;u++)a=e[u],s=l+re(a,u),c+=ae(a,r,i,s,o);else if(u=m(e),typeof u==`function`)for(e=u.call(e),u=0;!(a=e.next()).done;)a=a.value,s=l+re(a,u++),c+=ae(a,r,i,s,o);else if(s===`object`){if(typeof e.then==`function`)return ae(ie(e),r,i,a,o);throw r=String(e),Error(`Objects are not valid as a React child (found: `+(r===`[object Object]`?`object with keys {`+Object.keys(e).join(`, `)+`}`:r)+`). If you meant to render a collection of children, use an array instead.`)}return c}function oe(e,t,n){if(e==null)return e;var r=[],i=0;return ae(e,r,``,``,function(e){return t.call(n,e,i++)}),r}function se(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(t){(e._status===0||e._status===-1)&&(e._status=1,e._result=t)},function(t){(e._status===0||e._status===-1)&&(e._status=2,e._result=t)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var O=typeof reportError==`function`?reportError:function(e){if(typeof window==`object`&&typeof window.ErrorEvent==`function`){var t=new window.ErrorEvent(`error`,{bubbles:!0,cancelable:!0,message:typeof e==`object`&&e&&typeof e.message==`string`?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process==`object`&&typeof process.emit==`function`){process.emit(`uncaughtException`,e);return}console.error(e)},k={map:oe,forEach:function(e,t,n){oe(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return oe(e,function(){t++}),t},toArray:function(e){return oe(e,function(e){return e})||[]},only:function(e){if(!E(e))throw Error(`React.Children.only expected to receive a single React element child.`);return e}};e.Activity=f,e.Children=k,e.Component=v,e.Fragment=r,e.Profiler=a,e.PureComponent=b,e.StrictMode=i,e.Suspense=l,e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=w,e.__COMPILER_RUNTIME={__proto__:null,c:function(e){return w.H.useMemoCache(e)}},e.cache=function(e){return function(){return e.apply(null,arguments)}},e.cacheSignal=function(){return null},e.cloneElement=function(e,t,n){if(e==null)throw Error(`The argument must be a React element, but you passed `+e+`.`);var r=g({},e.props),i=e.key;if(t!=null)for(a in t.key!==void 0&&(i=``+t.key),t)!ee.call(t,a)||a===`key`||a===`__self`||a===`__source`||a===`ref`&&t.ref===void 0||(r[a]=t[a]);var a=arguments.length-2;if(a===1)r.children=n;else if(1<a){for(var o=Array(a),s=0;s<a;s++)o[s]=arguments[s+2];r.children=o}return T(e.type,i,r)},e.createContext=function(e){return e={$$typeof:s,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:o,_context:e},e},e.createElement=function(e,t,n){var r,i={},a=null;if(t!=null)for(r in t.key!==void 0&&(a=``+t.key),t)ee.call(t,r)&&r!==`key`&&r!==`__self`&&r!==`__source`&&(i[r]=t[r]);var o=arguments.length-2;if(o===1)i.children=n;else if(1<o){for(var s=Array(o),c=0;c<o;c++)s[c]=arguments[c+2];i.children=s}if(e&&e.defaultProps)for(r in o=e.defaultProps,o)i[r]===void 0&&(i[r]=o[r]);return T(e,a,i)},e.createRef=function(){return{current:null}},e.forwardRef=function(e){return{$$typeof:c,render:e}},e.isValidElement=E,e.lazy=function(e){return{$$typeof:d,_payload:{_status:-1,_result:e},_init:se}},e.memo=function(e,t){return{$$typeof:u,type:e,compare:t===void 0?null:t}},e.startTransition=function(e){var t=w.T,n={};w.T=n;try{var r=e(),i=w.S;i!==null&&i(n,r),typeof r==`object`&&r&&typeof r.then==`function`&&r.then(C,O)}catch(e){O(e)}finally{t!==null&&n.types!==null&&(t.types=n.types),w.T=t}},e.unstable_useCacheRefresh=function(){return w.H.useCacheRefresh()},e.use=function(e){return w.H.use(e)},e.useActionState=function(e,t,n){return w.H.useActionState(e,t,n)},e.useCallback=function(e,t){return w.H.useCallback(e,t)},e.useContext=function(e){return w.H.useContext(e)},e.useDebugValue=function(){},e.useDeferredValue=function(e,t){return w.H.useDeferredValue(e,t)},e.useEffect=function(e,t){return w.H.useEffect(e,t)},e.useEffectEvent=function(e){return w.H.useEffectEvent(e)},e.useId=function(){return w.H.useId()},e.useImperativeHandle=function(e,t,n){return w.H.useImperativeHandle(e,t,n)},e.useInsertionEffect=function(e,t){return w.H.useInsertionEffect(e,t)},e.useLayoutEffect=function(e,t){return w.H.useLayoutEffect(e,t)},e.useMemo=function(e,t){return w.H.useMemo(e,t)},e.useOptimistic=function(e,t){return w.H.useOptimistic(e,t)},e.useReducer=function(e,t,n){return w.H.useReducer(e,t,n)},e.useRef=function(e){return w.H.useRef(e)},e.useState=function(e){return w.H.useState(e)},e.useSyncExternalStore=function(e,t,n){return w.H.useSyncExternalStore(e,t,n)},e.useTransition=function(){return w.H.useTransition()},e.version=`19.2.7`})),u=o(((e,t)=>{t.exports=l()})),d=o((e=>{function t(e,t){var n=e.length;e.push(t);a:for(;0<n;){var r=n-1>>>1,a=e[r];if(0<i(a,t))e[r]=t,e[n]=a,n=r;else break a}}function n(e){return e.length===0?null:e[0]}function r(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;a:for(var r=0,a=e.length,o=a>>>1;r<o;){var s=2*(r+1)-1,c=e[s],l=s+1,u=e[l];if(0>i(c,n))l<a&&0>i(u,c)?(e[r]=u,e[l]=n,r=l):(e[r]=c,e[s]=n,r=s);else if(l<a&&0>i(u,n))e[r]=u,e[l]=n,r=l;else break a}}return t}function i(e,t){var n=e.sortIndex-t.sortIndex;return n===0?e.id-t.id:n}if(e.unstable_now=void 0,typeof performance==`object`&&typeof performance.now==`function`){var a=performance;e.unstable_now=function(){return a.now()}}else{var o=Date,s=o.now();e.unstable_now=function(){return o.now()-s}}var c=[],l=[],u=1,d=null,f=3,p=!1,m=!1,h=!1,g=!1,_=typeof setTimeout==`function`?setTimeout:null,v=typeof clearTimeout==`function`?clearTimeout:null,y=typeof setImmediate<`u`?setImmediate:null;function b(e){for(var i=n(l);i!==null;){if(i.callback===null)r(l);else if(i.startTime<=e)r(l),i.sortIndex=i.expirationTime,t(c,i);else break;i=n(l)}}function x(e){if(h=!1,b(e),!m)if(n(c)!==null)m=!0,S||(S=!0,E());else{var t=n(l);t!==null&&re(x,t.startTime-e)}}var S=!1,C=-1,w=5,ee=-1;function T(){return g?!0:!(e.unstable_now()-ee<w)}function te(){if(g=!1,S){var t=e.unstable_now();ee=t;var i=!0;try{a:{m=!1,h&&(h=!1,v(C),C=-1),p=!0;var a=f;try{b:{for(b(t),d=n(c);d!==null&&!(d.expirationTime>t&&T());){var o=d.callback;if(typeof o==`function`){d.callback=null,f=d.priorityLevel;var s=o(d.expirationTime<=t);if(t=e.unstable_now(),typeof s==`function`){d.callback=s,b(t),i=!0;break b}d===n(c)&&r(c),b(t)}else r(c);d=n(c)}if(d!==null)i=!0;else{var u=n(l);u!==null&&re(x,u.startTime-t),i=!1}}break a}finally{d=null,f=a,p=!1}i=void 0}}finally{i?E():S=!1}}}var E;if(typeof y==`function`)E=function(){y(te)};else if(typeof MessageChannel<`u`){var D=new MessageChannel,ne=D.port2;D.port1.onmessage=te,E=function(){ne.postMessage(null)}}else E=function(){_(te,0)};function re(t,n){C=_(function(){t(e.unstable_now())},n)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(e){e.callback=null},e.unstable_forceFrameRate=function(e){0>e||125<e?console.error(`forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`):w=0<e?Math.floor(1e3/e):5},e.unstable_getCurrentPriorityLevel=function(){return f},e.unstable_next=function(e){switch(f){case 1:case 2:case 3:var t=3;break;default:t=f}var n=f;f=t;try{return e()}finally{f=n}},e.unstable_requestPaint=function(){g=!0},e.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=f;f=e;try{return t()}finally{f=n}},e.unstable_scheduleCallback=function(r,i,a){var o=e.unstable_now();switch(typeof a==`object`&&a?(a=a.delay,a=typeof a==`number`&&0<a?o+a:o):a=o,r){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=a+s,r={id:u++,callback:i,priorityLevel:r,startTime:a,expirationTime:s,sortIndex:-1},a>o?(r.sortIndex=a,t(l,r),n(c)===null&&r===n(l)&&(h?(v(C),C=-1):h=!0,re(x,a-o))):(r.sortIndex=s,t(c,r),m||p||(m=!0,S||(S=!0,E()))),r},e.unstable_shouldYield=T,e.unstable_wrapCallback=function(e){var t=f;return function(){var n=f;f=t;try{return e.apply(this,arguments)}finally{f=n}}}})),f=o(((e,t)=>{t.exports=d()})),p=o((e=>{var t=u();function n(e){var t=`https://react.dev/errors/`+e;if(1<arguments.length){t+=`?args[]=`+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+=`&args[]=`+encodeURIComponent(arguments[n])}return`Minified React error #`+e+`; visit `+t+` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`}function r(){}var i={d:{f:r,r:function(){throw Error(n(522))},D:r,C:r,L:r,m:r,X:r,S:r,M:r},p:0,findDOMNode:null},a=Symbol.for(`react.portal`);function o(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:a,key:r==null?null:``+r,children:e,containerInfo:t,implementation:n}}var s=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function c(e,t){if(e===`font`)return``;if(typeof t==`string`)return t===`use-credentials`?t:``}e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,e.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(n(299));return o(e,t,null,r)},e.flushSync=function(e){var t=s.T,n=i.p;try{if(s.T=null,i.p=2,e)return e()}finally{s.T=t,i.p=n,i.d.f()}},e.preconnect=function(e,t){typeof e==`string`&&(t?(t=t.crossOrigin,t=typeof t==`string`?t===`use-credentials`?t:``:void 0):t=null,i.d.C(e,t))},e.prefetchDNS=function(e){typeof e==`string`&&i.d.D(e)},e.preinit=function(e,t){if(typeof e==`string`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin),a=typeof t.integrity==`string`?t.integrity:void 0,o=typeof t.fetchPriority==`string`?t.fetchPriority:void 0;n===`style`?i.d.S(e,typeof t.precedence==`string`?t.precedence:void 0,{crossOrigin:r,integrity:a,fetchPriority:o}):n===`script`&&i.d.X(e,{crossOrigin:r,integrity:a,fetchPriority:o,nonce:typeof t.nonce==`string`?t.nonce:void 0})}},e.preinitModule=function(e,t){if(typeof e==`string`)if(typeof t==`object`&&t){if(t.as==null||t.as===`script`){var n=c(t.as,t.crossOrigin);i.d.M(e,{crossOrigin:n,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0})}}else t??i.d.M(e)},e.preload=function(e,t){if(typeof e==`string`&&typeof t==`object`&&t&&typeof t.as==`string`){var n=t.as,r=c(n,t.crossOrigin);i.d.L(e,n,{crossOrigin:r,integrity:typeof t.integrity==`string`?t.integrity:void 0,nonce:typeof t.nonce==`string`?t.nonce:void 0,type:typeof t.type==`string`?t.type:void 0,fetchPriority:typeof t.fetchPriority==`string`?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy==`string`?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet==`string`?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes==`string`?t.imageSizes:void 0,media:typeof t.media==`string`?t.media:void×¿vóËh‘éì¶»§q«^v]X˜[YN™K˜[œØXÝ[ÛœÖÌOÖÊK˜[œØXÝ[ÛœÖÌK™]JN˜X]Z[™K˜[œØXÝ[ÛœÖÌOË›˜[Y_›È˜[œØXÝ[ÛœØW_JK
‹šœÞ
JÛËÝ]N˜š[\ˆ˜[œØXÝ[ÛœØÛÝ[^˜	Û›[™ÝH	Û›[™ÝOOLOØ˜[œØXÝ[Û˜˜˜[œØXÝ[ÛœØX˜[YNÛÚ[™ÙN›‹XÙZÛ\Ž˜Ø\™Ù]›Ý\ØYÙTÚ^™N˜KÛ”YÙTÚ^™PÚ[™ÙN›ËÛ”™\Ù]Š
OOžÛŠ
KJ
_KÚ[™[ŽŠ‹šœÞÊJX™[ØÛ\ÜÓ˜[YN˜š[\‹XÛÛ›ÛÚ[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜\XJK
‹šœÞÊJÙ[XÝÈ˜\šXK[X™[Ž˜˜[œØXÝ[Ûˆ\X˜[YNœ‹ÛÚ[™ÙN™OOšJK\™Ù]˜[YJKÚ[™[Ž–Ê‹šœÞ
JÜ[Û˜Ý˜[YN˜Ú[™[Ž˜[\\ØJK
‹šœÞ
JÜ[Û˜ØÚ[™[Ž˜•VXJK
‹šœÞ
JÜ[Û˜ØÚ[™[Ž˜ÑSJW_JW_J_JK
‹šœÞ
J›ËØÛÛ[[œÎ™‹›ÝÜÎ›Û”›ÝÐÛXÚÎOžÛ]IŠË‹‹™KœÜXÜË‹‹™Kœ˜Y\—JNÛ‰‰˜ÊË‹‹›‹Ý\œ™[šXÙN›‹˜Ý\œ™[šXÙOÏÝœšXÙ_J_KX›PÛ\ÜÎ˜\Ë]X[]Ü‹K]˜[œØXÝ[ÛœØ\šXSX™[˜˜[œØXÝ[ÛœÈYÙ\˜[\N˜›È˜[œØXÝ[ÛœÈY]ˆ^\È[™Ù[ÈÚ[\X\ˆ\™H]]ÛX]XØ[K˜[š]X[ÛÜ–ÞØÛÛ[[Ž˜˜[YX\Ž˜\ØØWKYÙTÚ^™N˜_JK
‹šœÞ
JÜËÚ][NœËÛÝ\˜ÙN˜ÜÚ][ÛœØÛÛÜÙNŠ
OO˜Ê[
_JW_J_Y[˜Ý[ÛˆœÊ
^Û]ÜÝ]N™_OSœŠ
KÝ—OJ\ÙTÝ]JJ
KÜ‹WOJ\ÙTÝ]JJ
KØK×OJ\ÙTÝ]JJJKÜË×OJ\ÙTÝ]JJ[
KVË‹‹™K˜[œØXÝ[ÛœË›X\
OOŠË‹‹™KÚ[™˜˜[œØXÝ[Û˜]™[\N™K\KÝ[[X\žN˜	ÙK\OOOX•VXØ›ÝYÚ˜ÛÛH	ÙKœ]X[]_H]	ÓJKœšXÙJ_IÓ[X™\‹š\Ñš[š]J[X™\ŠK˜˜[[˜ÙPY\ŠJOØÈ˜[[˜ÙH	ÓJK˜˜[[˜ÙPY\Š_X˜XJJK‹‹™Kœ˜Y\‹™š[\ŠOO™K˜YY]_K˜Ü™X]Y]
K›X\
OOŠË‹‹™KY˜˜Y\‹IÙKšYXÚ[™˜˜Y\˜˜[YN™K›˜[YK]N™K˜YY]_K˜Ü™X]Y]šXÙN™K˜Ý\œ™[šXÙK]™[\N˜QT˜Ý[[X\žN˜YYÈ˜Y\˜JJK‹‹™K˜Ø\™›Ý\Ë›X\
OOŠË‹‹™KY˜›ÝKIÙKšYXÚ[™˜›ÝX˜[YN™K˜Ø\™˜[YK]N™K\]Y]K˜Ü™X]Y]]™[\N˜“ÕXÝ[[X\žN™K^JJK‹‹ŠK\Ú\Ó›Ý\ß×JK›X\
OOŠË‹‹™KY˜\Ú\ËIÙKšYXÚ[™˜›ÝX˜[YN™K˜Ø\™˜[Y_Ù[™\˜[]N™K\]Y]K˜Ü™X]Y]]™[\N˜TÒTØÝ[[X\žN™K˜ÛÛšXÝ[ÛŸK^Ø]™Y\Ú\ØJJWK™š[\ŠOO™K™]JKœÛÜ

K
OO›™]È]J™]JK[™]È]JK™]JJKO[™š[\ŠOOŠ\ŸKšÚ[™OO\ŠI‰–ÙK›˜[YKKœÝ[[X\žKK™]™[\WKš›Ú[Š
KÓÝÙ\Ø\ÙJ
Kš[˜ÛY\ÊÓÝÙ\Ø\ÙJ
JJKVÞÚÙ^N˜˜[YXX™[˜Ø\™Z[•ÚYŒMÌÚYÜ›ÝÎŒKÚYÚš[šÎŒ_KÚÙ^N˜Ù]ØÛÙXX™[˜Ù][YÛŽ˜Ù[\˜ÚYÚYÚš[šÎŒ›Ü›X]™OO”Ýš[™ÊKœÙ]ØÛÙ_X
KÕ\\Ø\ÙJ
_KÚÙ^N˜ÛÛXÝÜ—Û[X™\˜X™[˜Ø[YÛŽ˜Ù[\˜ÚYÚYÚš[šÎŒ›Ü›X]™OO™K˜ÛÛXÝÜ—Û[X™\ŸXKÚÙ^N˜˜\š]XX™[˜˜\š]X[YÛŽ˜Ù[\˜ÚYÚYÚš[šÎŒ›Ü›X]‰ßKÚÙ^N˜ÛÛÜ˜X™[˜ÛÛÜ˜[YÛŽ˜Ù[\˜ÚYÚYÚš[šÎŒ›Ü›X]”[ßKÚÙ^N˜šXÙXX™[˜šXÙX[YÛŽ˜[Û™^XÚYÚYÚš[šÎŒÛÜ˜[YN™OO™KœšXÙOÒ
KœšXÙJN‹LK›Ü›X]™OO™KœšXÙOÓJKœšXÙJN˜XKÚÙ^N˜]XX™[˜]X[YÛŽ˜Ù[\˜ÚYŒLL‹ÚYÚš[šÎŒÛÜ˜[YN™OO™K™]OÛ™]È]JK™]JK™Ù][YJ
N‹LK›Ü›X]™OO›™]È]JK™]JKÓØØ[TÝš[™Ê
_KÚÙ^N˜]™[\XX™[˜\X[YÛŽ˜Ù[\˜ÚYNÚYÚš[šÎŒ™[™\Ž™OOŠ‹šœÞ
JÜ[˜ØÛ\ÜÓ˜[YN˜Ý]\Ë\[Ú[™[Ž™K™]™[\_J_KÚÙ^N˜›Ý\ØX™[˜›Ý\ØÚYÌ‹ÚYÚš[šÎŒÛÜ˜[YN™OO™K››Ý\ß›Ü›X]™OO™K™]™[\OOOX“ÕXÙKœÝ[[X\žN™K››Ý\ßXKÚÙ^N˜Ý[[X\žXX™[˜]Z[ÚYŒŒŒÚYÚš[šÎŒWNÜ™]\›Š‹šœÞÊJ‹‘œ˜YÛY[ØÚ[™[Ž–Ê‹šœÞ
JËÝ]N˜\ÝÜžX\ØÜš\[ÛŽ˜™XÙ[XÝ]š]H[™X\›š[™È˜Z[XÜ›ÜÜÈ˜[œØXÝ[ÛœË˜Y\‹[™›Ý\Ë˜JK
‹šœÞ
J[ËÚ][\Î–ÞÛX™[˜]™[Ø˜[YN››[™Ý]Z[˜™]šY]ØX›H™XÛÜ™ØKÛX™[˜˜Y\Ø˜[YN™K˜[œØXÝ[ÛœË›[™Ý]Z[˜^H[™Ù[]™[ØKÛX™[˜\ÜÛÛœÈÈ™]šY]Ø˜[YN™K˜Ø\™›Ý\Ë›[™Ý
ÊK\Ú\Ó›Ý\ß×JK›[™Ý]Z[˜Ø]™YXÚ\Ú[Ûˆ›Ý\ØKÛX™[˜›Ý\Ø˜[YN™K˜Ø\™›Ý\Ë›[™Ý]Z[˜Ø\™Y[[ÜžXW_JK
‹šœÞ
JÛËÝ]N˜š[\ˆ\ÝÜžXÛÝ[^˜	ÝK›[™ÝH	ÝK›[™ÝOOLOØ]™[˜]™[ØX˜[YNÛÚ[™ÙN›‹XÙZÛ\Ž˜]™[Ø\™]Z[YÙTÚ^™N˜KÛ”YÙTÚ^™PÚ[™ÙN›ËÛ”™\Ù]Š
OOžÛŠ
KJ
_KÚ[™[ŽŠ‹šœÞÊJX™[ØÛ\ÜÓ˜[YN˜š[\‹XÛÛ›ÛÚ[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜\XJK
‹šœÞÊJÙ[XÝÈ˜\šXK[X™[Ž˜\ÝÜžH\X˜[YNœ‹ÛÚ[™ÙN™OOšJK\™Ù]˜[YJKÚ[™[Ž–Ê‹šœÞ
JÜ[Û˜Ý˜[YN˜Ú[™[Ž˜[]™[ØJK
‹šœÞ
JÜ[Û˜Ý˜[YN˜˜[œØXÝ[Û˜Ú[™[Ž˜˜[œØXÝ[ÛœØJK
‹šœÞ
JÜ[Û˜Ý˜[YN˜˜Y\˜Ú[™[Ž˜˜Y\˜JK
‹šœÞ
JÜ[Û˜Ý˜[YN˜›ÝXÚ[™[Ž˜›Ý\ØJW_JW_J_JK
‹šœÞ
J›ËØÛÛ[[œÎ™›ÝÜÎKÛ”›ÝÐÛXÚÎOžÛ]IŠË‹‹™KœÜXÜË‹‹™Kœ˜Y\—JNÛ‰‰˜ÊŠ_KX›PÛ\ÜÎ˜\Ë]X[]Ü‹KZ\ÝÜžX\šXSX™[˜XÝ]š]H\ÝÜžX[\N˜XÝ]š]HÚ[\X\ˆ\™H\È[ÝHÛÜšË˜[š]X[ÛÜ–ÞØÛÛ[[Ž˜˜[YX\Ž˜\ØØWKYÙTÚ^™N˜_JK
‹šœÞ
JÜËÚ][NœËÛÝ\˜ÙN˜ÜÚ][ÛœØÛÛÜÙNŠ
OO˜Ê[
_JW_J_Y[˜Ý[ÛˆÊ
^Û]ÜÝ]N™_OSœŠ
KZ

KÛ‹—OJ\ÙTÝ]JJ[
KO\ŠKœÜXÜËK˜Ø\Ú
KOJ\ÙSY[[ÊJ

OO”ÚJJKÙWJKÏJ\ÙSY[[ÊJ

OOZJJKØWJKÏJK
OOŠË‹‹™K]N˜	ÙK›˜[Y_HH	Ù\ÊJ_X]Z[˜	ÝHH	ÓJK˜Ý\œ™[šXÙJ_IÙK\™Ù]˜[YOØOˆ	ÙKœÛÝ\˜ÙOOOX˜Y\˜Ø[žX˜\™Ù]H	ÓJK\™Ù]˜[YJ_X˜XJKÏVË‹‹™KœÜXÜË‹‹™Kœ˜Y\—K[™]ÈÙ]OVË‹‹™K˜Ø\™›Ý\×KœÛÜ

K
OO›™]È]J˜Ü™X]Y]\]Y]
K[™]È]JK˜Ü™X]Y]K\]Y]
JK™š[\ŠOOžÛ]QÜŠJ_K˜Ø\™Y	ÙK˜Ø\™˜[Y__	ÙKœÙ]ØÛÙ__	ÙK˜ÛÛXÝÜ—Û[X™\ŸXÜ™]\›ˆš\Ê
OÈLNŠ˜Y

KL
_JKœÛXÙJJK›X\
OOžÛ]VŠKÊNÜ™]\›žË‹‹K]N˜	ÙK˜Ø\™˜[Y_Ë›˜[Y_Ù[™\˜[›ÝXIÝØH	Ù\Ê
_X˜X]Z[˜	ÔÝš[™ÊK^
KœÛXÙJÌŠ_HÈ	ÖÊK˜Ü™X]Y]K\]Y]
_XÝ]XÎˆ]_JKVÖØ^]]ØËœ]Y]Y\Ë™^]]Ë›X\
OOœÊK^]]
JK›È^]]Ë˜KØ[žH]ØËœ]Y]Y\Ë™[žR]Ë›X\
OOœÊK[žH]
JK›È[žH]Ë˜KØ^]™X\˜Ëœ]Y]Y\Ë™^]™X\‹›X\
OOœÊKKœÝ]\ÏOOX^]™X\˜Ø^]™X\˜˜^]Ø]Ú
JK›Ý[™È™X\ˆ^]˜KØ[žH™X\˜Ëœ]Y]Y\Ë™[žS™X\‹›X\
OOœÊKKœÝ]\ÏOOX[žH™X\˜Ø[žH™X\˜˜[žHØ]Ú
JK›Ý[™È™X\ˆ[žK˜KØX\šÙ]ÚXÚÜÈYXËœ]Y]Y\Ë›X\šÙ]YK›X\
OOœÊKX\šÙ]ÚXÚÈYX
JK›ÈX\šÙ]ÚXÚÜÈYK˜KØÛ™]šY]ÜÈYXËœ]Y]Y\ËšÛYK›X\
OOœÊKKœÝ]\ËœÝ\ÕÚ]
Û
OØÛ™]šY]ÈYX˜ÛZ\ÜÚ[™Ø
JK›ÈÛ™]šY]ÜÈYK˜KØZ\ÜÚ[™È[œØËœ]Y]Y\Ë›Z\ÜÚ[™Ô[œË›X\
OOœÊKKœ™X\ÛÛ“X™[
JK[œÈÛÚÈš[Y[‹˜KØ™XÙ[›Ý\ØK›È™XÙ[›Ý\Ë˜WNÜ™]\›Š‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜\Ú›Ø\™]šY]ØÚ[™[Ž–Ê‹šœÞ
JËÝ]N˜\Ú›Ø\™\ØÜš\[ÛŽ˜Ú]È[œÜXÝš\œÝÙ^K˜JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜Y]šXËYÜšY\Ú›Ø\™\Ý]KYÜšYÚ[™[Ž–Ê‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜Y]šXËXØ\™Ú[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜Ø\ÚJK
‹šœÞ
JÝ›Û™ØØÚ[™[Ž“JK˜Ø\Ú
_JK
‹šœÞ
JÛX[ØÚ[™[Ž˜]˜Z[X›XJW_JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜Y]šXËXØ\™Y]šXËXØ\™KIÚKœ›Ùš]ÜÜÏŒØÜÚ]]™XšKœ›Ùš]ÜÜÏØ™YØ]]™X˜™]]˜[XÚ[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜\]Z]HÈÜ[ˆ	“JK
‹šœÞÊJÝ›Û™ØØÚ[™[Ž–ÓJKÝ[\]Z]JKÈKœ›Ùš]ÜÜÏÖ›ÊKœ›Ùš]ÜÜÊN“J
W_JK
‹šœÞ
JÛX[ØÚ[™[ŽÊKœ›Ùš]ÜÜÔ\˜Ù[
_JW_JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜Y]šXËXØ\™Ú[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜˜XÚÙYš[[™ÜØJK
‹šœÞ
JÝ›Û™ØØÚ[™[Ž™KœÜXÜË›[™Ý
ÙKœ˜Y\‹›[™ÝJK
‹šœÞÊJÛX[ØÚ[™[Ž–ÙKœÜXÜË›[™ÝÜÚ][ÛœËKœ˜Y\‹›[™Ý˜Y\˜_JW_JK
‹šœÞÊJ]Û˜Ý\N˜]Û˜Û\ÜÓ˜[YN˜Y]šXËXØ\™Y]šXËXØ\™KXXÝ[Û˜ÛÛXÚÎŠ
OO
ÜÚYÛ˜[Ø
KÚ[™[Ž–Ê‹šœÞ
JÜ[˜ØÚ[™[Ž˜ÚYÛ˜[ØJK
‹šœÞÊJÝ›Û™ØØÚ[™[Ž–ÛË˜XÝ]™PÛÝ[XÝ]™X_JK
‹šœÞ
JÛX[ØÚ[™[Ž˜Ü[ˆÚYÛ˜[ØJW_JW_JK
‹šœÞ
J]˜ØÛ\ÜÓ˜[YN˜ØØ[‹YÜšY\Ú›Ø\™]ÛÜšËYÜšYÚ[™[Ž™›X\

ÙK—JOOŠ‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜ØØ[‹\[™[Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž™_JK›[™ÝÝ›X\

ŠOOœÝ]XÏÊ‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜ØØ[‹\›ÝÈ\Ú›Ø\™\]Y]YK\›ÝØÚ[™[Ž–Ê‹šœÞ
JÝ›Û™ØØÚ[™[Ž]_JK
‹šœÞ
JÜ[˜ØÚ[™[Ž™]Z[JW_K	Ù_KIÛŸX
NŠ‹šœÞÊJ]Û˜Ý\N˜]Û˜Û\ÜÓ˜[YN˜ØØ[‹\›ÝÈ\Ú›Ø\™\]Y]YK\›ÝÈ][[Û‹\]Y]YK\›ÝØÛÛXÚÎŠ
OOœŠ
KÚ[™[Ž–Ê‹šœÞ
JÝ›Û™ØØÚ[™[Ž]_JK
‹šœÞ
JÜ[˜ØÚ[™[Ž™]Z[JW_K	Ù_KIÝšYKIÛŸX
JNŠ‹šœÞ
J]˜ØÛ\ÜÓ˜[YN˜[\K\Ý]HÛÛ\XÝÚ[™[Ž›ŸJW_KJJ_JK
‹šœÞ
JÜËÚ][N›‹ÛÝ\˜ÙN›ËœÛÝ\˜Ù_Ü›Û[ØÛÛÜÙNŠ
OOœŠ[
_JW_J_Y[˜Ý[ÛˆÜÊ
^Û]ÜÝ]N™K\]TÝ]NÜ™X]P˜XÚÝ\›‹\œÙP˜XÚÝ\^œ‹™\ÝÜ™P˜XÚÝ\š_OSœŠ
KØK×OJ\ÙTÝ]JJ[
KÏ[ÜÊ
KÏJ\ÙSY[[ÊJ

OOš‹˜Z[™XÛÛ˜Ú[X][Û”™\Ü
ÜÜXÜÎ™KœÜXÜË˜[œØXÝ[ÛœÎ™K˜[œØXÝ[ÛœßJKÙKœÜXÜËK˜[œØXÝ[Ûœ×JNÙ[˜Ý[Ûˆ

^Û]O[™]È›ØŠÒ”ÓÓ‹œÝš[™ÚYžJŠ
K[ŠWKÝ\N˜\XØ][Û‹ÚœÛÛ˜JKYØÝ[Y[˜Ü™X]Q[[Y[
X
NÝš™YUT“˜Ü™X]SØš™XÝT“
JK™ÝÛ›ØYXX[˜\ÜXËX˜XÚÝ\IÛ™]È]J
KÒTÓÔÝš[™Ê
KœÛXÙJL
_KšœÛÛ˜˜ÛXÚÊ
KT“œ™]›ÚÙSØš™XÝT“
š™YŠKËœÚÝÊ˜XÚÝ\^ÜY˜
_X\Þ[˜È[˜Ý[ÛˆJJ^Û]YK\™Ù]™š[\ÏË–ÌNÚYŠ]
\™]\›ŽÛ]\Š]ØZ]^

JNÛ‹›ÚÏÛÊ‹˜˜XÚÝ\
NœËœÚÝÊ‹›Y\ÜØYÙKØ\›š[™Ø
KK\™Ù]˜[YOXX\Þ[˜È[˜Ý[Ûˆ

^Ýž^ÜËœÚÝÊ™Yœ™\Ú[™ÈØÜžY˜[šXÙ\ø )˜
NÛ]X]ØZ]JË‹‹›™]ÈX\
Ë‹‹™KœÜXÜË‹‹™Kœ˜Y\—K›X\
OO–ÙKšYWJJK˜[Y\Ê
WJK[™]ÈX\
‹š][\Ë›X\
OO–ÙKšYWJJKO[™]È]J
KÒTÓÔÝš[™Ê
KOZKœÛXÙJL
NÝ
OOžÛ][‹š][\Ë›X\
OOŠÙ]N˜KØ\™Y™KœØÜžY˜[ÚYKšY˜[YN™K›˜[YKÙ]™KœÙ]ØÛÙK›Ú[ˆHYK™›Ú[šXÙN’
K˜Ý\œ™[šXÙJKÛÝ\˜ÙN˜ØÜžY˜[Ø]™Y]š_JJK™š[\ŠOœšXÙOŒ	‰ˆYKœšXÙTÛ˜\ÚÝËœÛÛYJOO™K™]OOOXI‰™K˜Ø\™YOO]˜Ø\™Y	‰ˆHYK™›Ú[OO]™›Ú[
JNÜ™]\›žË‹‹™KÜXÜÎ™KœÜXÜË›X\
OOœ‹™Ù]
KšY
_JK˜Y\Ž™Kœ˜Y\‹›X\
OOœ‹™Ù]
KšY
_JKšXÙTÛ˜\ÚÝÎ–Ë‹‹™KœšXÙTÛ˜\ÚÝË‹‹KšXÙT™Yœ™\ÚÝ]\ÎžØÚXÚÙY]šK\]YÛÝ[›‹\]Y__JKËœÚÝÊ\]Y	Û‹\]YH˜XÚÙYš[[™ÈšXÙ\Ë˜
_XØ]Ú
J^ÜËœÚÝÊK›Y\ÜØYÙKØ\›š[™Ø
__\™]\›Š‹šœÞÊJ‹‘œ˜YÛY[ØÚ[™[Ž–Ê‹šœÞ
JËÝ]N˜YZ[˜\ØÜš\[ÛŽ˜›ÝXÝØØ[]H[™X[˜YÙHÛÛ›ÛYXZ[[˜[˜ÙHXÝ[ÛœË˜JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜YZ[‹YÜšY\š]KXYZ[‹YÜšYÚ[™[Ž–Ê‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹\[™[Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜Ø\ÚJK
‹šœÞ
JØÚ[™[Ž˜™\Ù]Û›HH\\ˆ˜Y[™ÈØ\Ú˜[[˜ÙKˆÜÚ][ÛœË˜Y\‹›Ý\Ë[™\ÝÜžH™[XZ[ˆ[XÝ˜JK
‹šœÞ
JÝ›Û™ØØÚ[™[Ž“JK˜Ø\Ú
_JK
‹šœÞ
J]Û˜ØÛ\ÜÓ˜[YN˜[™Ù\˜ÛÛXÚÎŠ
OOžØÛÛ™š\›J™\Ù]Ø\ÚÈ	LØ
I‰
OOŠË‹‹™KØ\ÚŒYMJJ_KÚ[™[Ž˜™\Ù]Ø\ÚJW_JK
‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹\[™[Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜]HØY™]XJK
‹šœÞ
JØÚ[™[Ž˜^ÜHÛÛ\]HØØ[˜XÚÝ\Üˆ™\ÝÜ™HH™]š[Ý\ÛH^ÜYX[˜TÜXÈš[K˜JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜]Û‹\›ÝØÚ[™[Ž–Ê‹šœÞ
J]Û˜ÛÛÛXÚÎ›Ú[™[Ž˜^Ü˜XÚÝ\JK
‹šœÞÊJX™[ØÛ\ÜÓ˜[YN˜]ÛˆÙXÛÛ™\žXÚ[™[Ž–Ø[\Ü˜XÚÝ\
‹šœÞ
J[œ]ÚY[ŽˆL\N˜š[XXØÙ\˜\XØ][Û‹ÚœÛÛ‹šœÛÛ˜ÛÚ[™ÙN_JW_JW_JW_JK
‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹\[™[Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜šXÙ\ØJK
‹šœÞ
JØÚ[™[Ž˜™Yœ™\Ú˜XÚÙYØÜžY˜[šXÙ\È[™Ø]™HÙ^x &\ÈšXÙKZ\ÝÜžHÛ˜\ÚÝË˜JK
‹šœÞ
J]Û˜ÛÛÛXÚÎ™Ú[™[Ž˜[ˆšXÙH]Y]JK
‹šœÞ
JÛX[ØÚ[™[Ž™KœšXÙT™Yœ™\ÚÝ]\ÏË˜ÚXÚÙY]Ø\Ý[ˆ	Û™]È]JKœšXÙT™Yœ™\ÚÝ]\Ë˜ÚXÚÙY]
KÓØØ[TÝš[™Ê
_X˜›È]Y]™XÛÜ™YJW_JK
‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹\[™[Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜[YÜ˜][ÛœØJK
‹šœÞ
JØÚ[™[Ž˜^\›˜[ÛÝ\˜ÙHX[˜YÙ[Y[\È™\Ù\™Y›ÜˆH]\ˆ›ÙXÝ\ÙK˜JK
‹šœÞ
J]Û˜Ù\ØX›YˆLÚ[™[Ž˜X[˜YÙHÛÝ\˜Ù\ØJK
‹šœÞ
JÛX[ØÚ[™[Ž˜›Ý]˜Z[X›H[ˆ\ÈÜZÙXJW_JW_JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜YZ[‹YXYÛ›ÜÝXÜØÚ[™[Ž–Ê‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹XØ\™Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜YÙ\ˆ™XÛÛ˜Ú[X][Û˜JK
‹šœÞ
JØÚ[™[Ž˜™XY[Û›HÛÛ\\š\ÛÛˆÙˆÝ\œ™[ÜÚ][ÛœÈYØZ[œÝ˜[œØXÝ[Û‹\›Ú™XÝYÛ[™ÜË˜JK
‹šœÞÊJØÚ[™[Ž–Ê‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜š[™[™ÜØJK
‹šœÞ
JØÛ\ÜÓ˜[YN˜ËœÝ[[X\žK™š[™[™ÐÛÝ[Ø™YØ]]™X˜ÜÚ]]™XÚ[™[Ž˜ËœÝ[[X\žK™š[™[™ÐÛÝ[JW_JK
‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜X]ÚYJK
‹šœÞ
JØÚ[™[Ž˜ËœÝ[[X\žK›X]ÚYJW_JK
‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜›Ú™XÝ[Ûˆ\ÜÝY\ØJK
‹šœÞ
JØÚ[™[Ž˜Ëœ›Ú™XÝ[Û’\ÜÝY\Ë›[™ÝJW_JW_JW_JK
‹šœÞÊJÙXÝ[Û˜ØÛ\ÜÓ˜[YN˜YZ[‹XØ\™Ú[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜™XXÝÝÜ˜YÙHXYÛ›ÜÝXÜØJK
‹šœÞ
JØÚ[™[Ž˜]H™[XZ[œÈØØ[È\Èœ›ÝÜÙ\‹ˆ\ÙH^ÜÈ›Üˆ\˜X›H˜XÚÝ\[™]šXÙH˜[œÙ™\‹˜JK
‹šœÞÊJØÚ[™[Ž–Ê‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜ÜÚ][ÛœØJK
‹šœÞ
JØÚ[™[Ž™KœÜXÜË›[™ÝJW_JK
‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜˜Y\˜JK
‹šœÞ
JØÚ[™[Ž™Kœ˜Y\‹›[™ÝJW_JK
‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜Û˜\ÚÝØJK
‹šœÞ
JØÚ[™[Ž™KœšXÙTÛ˜\ÚÝË›[™ÝJW_JW_JW_JW_JK
‹šœÞ
JÛËÛÜ[ŽˆHXK]N˜™\ÝÜ™HX[˜TÜXÈ˜XÚÝ\ØÛÛÜÙNŠ
OO›Ê[
KÚ[™[Ž˜I‰Š‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜™XXÝY›Ü›XÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž˜\ÈÚ[™\XÙHÝ\œ™[ØØ[]Kˆ[ˆ[Y\™Ù[˜ÞH™KZ[\ÜÛÜH\È™]Z[™YžHHÝÜ˜YÙH^Y\‹˜JK
‹šœÞ
JØÛ\ÜÓ˜[YN˜˜XÚÝ\XÛÝ[ØÚ[™[Ž“Øš™XÝ™[šY\ÊK˜ÛÝ[ÊK›X\

ÙKJOOŠ‹šœÞÊJ]˜ØÚ[™[Ž–Ê‹šœÞ
JØÚ[™[Ž™_JK
‹šœÞ
JØÚ[™[ŽJW_KJJ_JK
‹šœÞÊJ]˜ØÛ\ÜÓ˜[YN˜[Ù[XXÝ[ÛœØÚ[™[Ž–Ê‹šœÞ
J]Û˜ØÛ\ÜÓ˜[YN˜ÙXÛÛ™\žXÛÛXÚÎŠ
OO›Ê[
KÚ[™[Ž˜Ø[˜Ù[JK
‹šœÞ
J]Û˜ÛÛÛXÚÎŠ
OOžÝž^ÚJJKÊ[
KËœÚÝÊ˜XÚÝ\™\ÝÜ™Y˜
_XØ]Ú
J^ÜËœÚÝÊK›Y\ÜØYÙKØ\›š[™Ø
__KÚ[™[Ž˜™\ÝÜ™H˜XÚÝ\JW_JW_J_JK
‹šœÞ
J›ËÛ›ÝXÙNœË››ÝXÙKÛ‘\ÛZ\ÜÎœË™\ÛZ\ÜßJW_J_Y[˜Ý[ÛˆÜÊ
^Ü™]\›Š‹šœÞ
JÝØÚ[™[ŽŠ‹šœÞÊJÝÙ[[Y[Š‹šœÞ
Jœ‹ßJKÚ[™[Ž–Ê‹šœÞ
JÝÚ[™^ˆL[[Y[Š‹šœÞ
JÜ™\XÙNˆLÎ˜Ù\Ú›Ø\™J_JK
‹šœÞ
JÝÜ]˜Ù\Ú›Ø\™[[Y[Š‹šœÞ
JËßJ_JK
‹šœÞ
JÝÜ]˜Ü˜Y\˜[[Y[Š‹šœÞ
JËßJ_JK
‹šœÞ
JÝÜ]˜ÜÜÚ][ÛœØ[[Y[Š‹šœÞ
J\ËßJ_JK
‹šœÞ
JÝÜ]˜ÜÚYÛ˜[Ø[[Y[Š‹šœÞ
JœËßJ_JK
‹šœÞ
JÝÜ]˜Ý˜[œØXÝ[ÛœØ[[Y[Š‹šœÞ
J\ËßJ_JK
‹šœÞ
JÝÜ]˜Ú\ÝÜžX[[Y[Š‹šœÞ
JœËßJ_JK
‹šœÞ
JÝÜ]˜ØYZ[˜[[Y[Š‹šœÞ
JÜËßJ_JK
‹šœÞ
JÝÜ]˜
˜[[Y[Š‹šœÞ
JÜ™\XÙNˆLÎ˜Ù\Ú›Ø\™J_JW_J_J_]˜\ˆÜÏXÛ\ÜÈ^[™ÈÛÛ\Û™[ÜÝ]O^Ù\œ›ÜŽ›[NÜÝ]XÈÙ]\š]™YÝ]Qœ›ÛQ\œ›ÜŠJ^Ü™]\›žÙ\œ›ÜŽ™__\™[™\Š
^Ü™]\›ˆ\ËœÝ]K™\œ›ÜÊ‹šœÞÊJXZ[˜ØÛ\ÜÓ˜[YN˜˜][Y\œ›Ü˜Ú[™[Ž–Ê‹šœÞ
JXØÚ[™[Ž˜X[˜TÜXÈ][ˆ[™^XÝY\œ›Ü˜JK
‹šœÞ
JØÚ[™[Ž˜[Ý\ˆØØ[]H\È›Ý™Y[ˆÛX\™Yˆ™[ØYH\ÈYˆH›Ø›[H™]\›œË^ÜÜˆ™\Ù\™Hœ›ÝÜÙ\ˆÝÜ˜YÙH™Y›Ü™H›ÝX›\ÚÛÝ[™Ë˜JK
‹šœÞ
J™XØÚ[™[Ž\ËœÝ]K™\œ›Ü‹›Y\ÜØYÙ_JK
‹šœÞ
J]Û˜ÛÛÛXÚÎŠ
OO™ÛØ˜[\Ë›ØØ][Û‹œ™[ØY

KÚ[™[Ž˜™[ØYX[˜TÜXØJW_JN\Ëœ›ÜË˜Ú[™[Ÿ_NÊœ‹˜Ü™X]T›ÛÝ
JØÝ[Y[™Ù][[Y[žRY
›ÛÝ
JKœ™[™\Š
‹šœÞ
J”ÝšXÝ[ÙKØÚ[™[ŽŠ‹šœÞ
J[‹ØÚ[™[ŽŠ‹šœÞ
JÜËØÚ[™[ŽŠ‹šœÞ
J\‹ØÚ[™[ŽŠ‹šœÞ
JÜËßJ_J_J_J_JJNÃB‹ËÈÈÛÝ\˜ÙSX\[™ÕT“Z[™^Q]ËšœË›X\