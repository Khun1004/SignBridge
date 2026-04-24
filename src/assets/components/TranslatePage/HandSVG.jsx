// ══════════════════════════════════════════════════════════════
//  HandSVG — 16종 손 모양 SVG 아이콘
// ══════════════════════════════════════════════════════════════

export default function HandSVG({ type: t, color: c }) {
    if (t === 'open') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-7,-2,-7,-17],[-3,-1,-3,-20],[1,-1,1,-20],[5,-1,5,-17],[8,2,13,-5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'thumbUp') return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-4,1,-4,9],[-1,1,-1,9],[2,1,2,9],[5,1,5,9]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-15" cy="-11" r="2.8" fill={c}/>
        </g>
    )
    if (t === 'thumbDown') return (
        <g>
            <ellipse cx="0" cy="-4" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-4,-2,-4,-10],[-1,-2,-1,-10],[2,-2,2,-10],[5,-2,5,-10]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="-2" x2="-15" y2="10" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-15" cy="10" r="2.8" fill={c}/>
        </g>
    )
    if (t === 'peace') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-5" y1="-1" x2="-5" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="-1" y1="-1" x2="-1" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            {[[3,-1,3,6],[7,-1,7,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-9" y1="2" x2="-13" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'ok') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <circle cx="-8" cy="-8" r="6" fill="none" stroke={c} strokeWidth="2.5"/>
            {[[1,0,1,-17],[5,0,5,-19],[9,0,9,-15]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'point') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-4" y1="-1" x2="-4" y2="-21" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <circle cx="-4" cy="-21" r="3.5" fill={c}/>
            {[[0,-1,0,6],[4,-1,4,5],[7,-1,7,4]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-12" y2="8" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'love') return (
        <g>
            <ellipse cx="0" cy="3" rx="12" ry="9" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-6" y1="-1" x2="-6" y2="-19" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            {[[-1,-1,-1,6],[3,-1,3,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="7" y1="-1" x2="7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="-10" y1="2" x2="-15" y2="-11" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'stop') return (
        <g>
            <ellipse cx="0" cy="3" rx="11" ry="9" fill={c} opacity="0.35" stroke={c} strokeWidth="2"/>
            {[[-7,-2,-7,-18],[-3,-1,-3,-21],[1,-1,1,-21],[5,-1,5,-18],[8,2,13,-5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-10" y1="5" x2="14" y2="5" stroke={c} strokeWidth="2" strokeOpacity="0.5"/>
        </g>
    )
    if (t === 'call') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-1,-1,-1,6],[3,-1,3,5],[-3,-1,-3,5]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-7" y1="-1" x2="-7" y2="-17" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="6" y1="-1" x2="6" y2="-15" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'fist') return (
        <g>
            <ellipse cx="0" cy="2" rx="12" ry="10" fill={c} opacity="0.4" stroke={c} strokeWidth="2"/>
            <rect x="-10" y="-3" width="20" height="10" rx="5" fill={c} opacity="0.5"/>
        </g>
    )
    if (t === 'number') return (
        <g>
            <ellipse cx="0" cy="4" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <line x1="-2" y1="0" x2="-2" y2="-22" stroke={c} strokeWidth="5" strokeLinecap="round"/>
            <circle cx="-2" cy="-22" r="4" fill={c}/>
            {[[-6,0,-6,8],[2,0,2,8],[6,0,6,7]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
            <line x1="-9" y1="2" x2="-14" y2="9" stroke={c} strokeWidth="4.5" strokeLinecap="round"/>
        </g>
    )
    if (t === 'flat') return (
        <g>
            <ellipse cx="0" cy="0" rx="14" ry="7" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            {[[-9,-2,-20,-2],[-4,-3,-4,-14],[0,-3,0,-16],[4,-3,4,-14],[8,-2,8,-12]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'cup') return (
        <g>
            <path d="M -12 0 Q -6 14 0 14 Q 6 14 12 0" fill={c} opacity="0.2" stroke={c} strokeWidth="2"/>
            {[[-10,-2,-10,8],[-5,-3,-5,10],[0,-3,0,11],[5,-3,5,10],[9,-2,9,8]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round"/>)}
            <line x1="-13" y1="3" x2="-16" y2="10" stroke={c} strokeWidth="4" strokeLinecap="round"/>
        </g>
    )
    if (t === 'pinch') return (
        <g>
            <ellipse cx="0" cy="3" rx="10" ry="8" fill={c} opacity="0.25" stroke={c} strokeWidth="1.5"/>
            <circle cx="-6" cy="-10" r="5.5" fill="none" stroke={c} strokeWidth="2.5"/>
            <circle cx="-6" cy="-10" r="2" fill={c}/>
            {[[2,-1,2,6],[6,-1,6,5],[9,-1,9,4]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4.5" strokeLinecap="round"/>)}
        </g>
    )
    if (t === 'cross') return (
        <g>
            <line x1="-14" y1="-14" x2="14" y2="14" stroke={c} strokeWidth="10" strokeLinecap="round" opacity="0.7"/>
            <line x1="14" y1="-14" x2="-14" y2="14" stroke={c} strokeWidth="10" strokeLinecap="round" opacity="0.7"/>
            <circle cx="0" cy="0" r="5" fill={c}/>
        </g>
    )
    // relaxed (idle)
    return (
        <g>
            <ellipse cx="0" cy="5" rx="10" ry="9" fill={c} opacity="0.2" stroke={c} strokeWidth="1.5"/>
            {[[-5,0,-5,10],[-2,0,-2,12],[2,0,2,12],[5,0,5,10]].map(([x1,y1,x2,y2],i)=>
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round"/>)}
            <line x1="-8" y1="2" x2="-12" y2="10" stroke={c} strokeWidth="4" strokeLinecap="round"/>
        </g>
    )
}