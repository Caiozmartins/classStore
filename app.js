const canvas = document.getElementById('classroomCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const tooltipText = document.getElementById('tooltip-text');
const tooltipIcon = document.getElementById('tooltip-icon');

// Paleta de Cores — Estilo Pixel Classroom
const colors = {
    floor: '#EBC49F',
    grid: '#D9A066',
    wallTop: '#CED4E7',
    wall: '#7281A3',
    woodBase: '#BE2633',
    woodTop: '#D94452',
    woodHover: '#D94452',
    woodBorder: '#8A1A26',
    teacherDesk: '#BE2633',
    teacherDeskTop: '#D94452',
    teacherHover: '#D94452',
    whiteboard: '#3F3F74',
    boardBorder: '#D9A066',
    window: '#639BFF',
    accent: '#5B6EE1',
    red: '#BE2633',
    green: '#38B449',
    cyan: '#5FCDE4',
    yellow: '#F4B41B'
};

// Estado do mouse
let mouseX = 0;
let mouseY = 0;
let ripples = [];

// Estado de arrasto (Drag & Drop das Plaquinhas)
let dragTarget = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let hasDragged = false;

// --- 1. DEFINIÇÃO DA SALA E MESAS ---

const deskPathsData = [
    // Group 1 (Esquerda)
    [
        "M139.765 319.634L157.772 344.863L114.265 337.256L139.765 319.634Z",
        "M140.941 319.645L167.149 303.932L158.918 344.354L140.941 319.645Z",
        "M140.339 317.832L122.208 292.693L165.752 300.085L140.339 317.832Z",
        "M139.163 317.828L113.034 333.67L121.064 293.208L139.163 317.828Z"
    ],
    // Group 2 (Centro-Baixo)
    [
        "M362.552 349.632L378.415 376.261L335.684 365.088L362.552 349.632Z",
        "M363.724 349.74L391.138 336.243L379.6 375.848L363.724 349.74Z",
        "M363.273 347.883L347.278 321.333L390.064 332.294L363.273 347.883Z",
        "M362.101 347.782L334.753 361.414L346.096 321.752L362.101 347.782Z"
    ],
    // Group 3 (Topo-Direita)
    [
        "M416.461 133.672L438.544 155.422H394.377L416.461 133.672Z",
        "M417.622 133.48L440.731 113.487L439.586 154.723L417.622 133.48Z",
        "M416.716 131.798L394.525 110.157L438.692 109.939L416.716 131.798Z",
        "M415.556 131.996L392.547 152.102L393.487 110.861L415.556 131.996Z"
    ],
    // Group 4 (Centro-Direita)
    [
        "M433.956 237.933L464.263 244.435L426.994 268.137L433.956 237.933Z",
        "M434.833 237.148L443.604 207.877L464.767 243.287L434.833 237.148Z",
        "M433.166 236.215L402.828 229.863L439.979 205.977L433.166 236.215Z",
        "M432.294 237.004L423.668 266.319L402.33 231.014L432.294 237.004Z"
    ],
    // Group 5 (Centro)
    [
        "M242.034 216.02L272.395 222.261L235.332 246.282L242.034 216.02Z",
        "M242.904 215.227L251.423 185.882L272.889 221.108L242.904 215.227Z",
        "M241.23 214.308L210.838 208.217L247.782 184.013L241.23 214.308Z",
        "M240.364 215.105L231.99 244.492L210.35 209.372L240.364 215.105Z"
    ]
];

const deskCenters = [
    { x: 140, y: 318 },
    { x: 362, y: 348 },
    { x: 416, y: 132 },
    { x: 433, y: 236 },
    { x: 241, y: 215 }
];

const desks = deskPathsData.map((deskGroup, index) => ({
    id: `Group ${index + 1}`,
    paths: deskGroup.map(d => new Path2D(d)),
    centerX: deskCenters[index].x,
    centerY: deskCenters[index].y,
    isHovered: false
}));

const teacherDesk = {
    id: "Teacher's Desk",
    x: 52.74, y: 65.67, w: 128, h: 41,
    isHovered: false
};

const teacher = { id: 'Teacher', x: 117, y: 54, targetX: 117, targetY: 54, isHovered: false, isSelected: false, radius: 50 };

const students = [
    { id: 'Alice', x: 45, y: 440, targetX: 45, targetY: 440, isHovered: false, isSelected: false, radius: 50 }
];

const studentImage = new Image();
studentImage.src = 'aluno.png';

const teacherImage = new Image();
teacherImage.src = 'professora.png';

const signs = [
    { text: 'In the front', x: 440, y: 15, w: 90, h: 25, isHovered: false },
    { text: 'In the back', x: 440, y: 45, w: 90, h: 25, isHovered: false },
    { text: 'In the middle', x: 440, y: 75, w: 90, h: 25, isHovered: false },
    { text: 'In the corner', x: 440, y: 105, w: 90, h: 25, isHovered: false },
    { text: 'On the left', x: 440, y: 135, w: 90, h: 25, isHovered: false },
    { text: 'On the right', x: 440, y: 165, w: 90, h: 25, isHovered: false }
];

// --- PAINEL DE GERENCIAMENTO DE PLAQUINHAS ---

const signsList = document.getElementById('signsList');
const newSignInput = document.getElementById('newSignInput');
const addSignBtn = document.getElementById('addSignBtn');

function renderSignsPanel() {
    signsList.innerHTML = '';
    signs.forEach((sign, index) => {
        const chip = document.createElement('div');
        chip.className = 'sign-chip';
        chip.innerHTML = `
            <span class="sign-label">${sign.text}</span>
            <span class="edit-btn" title="Editar">&#9998;</span>
            <button class="remove-btn" title="Remover">&times;</button>
        `;

        // Editar
        chip.querySelector('.edit-btn').addEventListener('click', () => {
            const newText = prompt('Novo texto da plaquinha:', sign.text);
            if (newText && newText.trim()) {
                sign.text = newText.trim();
                // Recalcula largura
                ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
                sign.w = Math.max(70, ctx.measureText(sign.text).width + 24);
                renderSignsPanel();
            }
        });

        // Remover
        chip.querySelector('.remove-btn').addEventListener('click', () => {
            signs.splice(index, 1);
            renderSignsPanel();
        });

        signsList.appendChild(chip);
    });
}

function getNextSignY() {
    if (signs.length === 0) return 15;
    const last = signs[signs.length - 1];
    return last.y + last.h + 5;
}

addSignBtn.addEventListener('click', () => {
    const text = newSignInput.value.trim();
    if (!text) return;
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    const w = Math.max(70, ctx.measureText(text).width + 24);
    signs.push({ text, x: 440, y: getNextSignY(), w, h: 25, isHovered: false });
    newSignInput.value = '';
    renderSignsPanel();
});

newSignInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSignBtn.click();
});

renderSignsPanel();

// --- 2. FUNÇÕES DE DESENHO ---

function drawFloorAndWalls() {
    // Piso de madeira com padrão de tábuas
    ctx.fillStyle = colors.floor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.8;
    // Linhas horizontais (tábuas)
    for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
    // Linhas verticais alternadas (juntas das tábuas)
    for (let row = 0; row < canvas.height / 20; row++) {
        const offset = (row % 2) * 20;
        for (let x = offset; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, row * 20); ctx.lineTo(x, (row + 1) * 20); ctx.stroke();
        }
    }

    // Parede superior (faixa cinza-azulada)
    ctx.fillStyle = colors.wallTop;
    ctx.fillRect(0.74, 0.67, 539, 45);

    // Faixa decorativa embaixo da parede
    ctx.fillStyle = colors.wall;
    ctx.fillRect(0.74, 42, 539, 4);

    // Bordas da sala (paredes sólidas)
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 5;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    // Parede esquerda + topo + porta inferior
    ctx.beginPath();
    ctx.moveTo(214.74, 0.67);
    ctx.lineTo(0.74, 0.67);
    ctx.lineTo(0.74, 410.17);
    ctx.lineTo(60.74, 410.17);
    ctx.stroke();

    // Parede direita topo
    ctx.beginPath();
    ctx.moveTo(325.74, 0.67);
    ctx.lineTo(539.74, 0.67);
    ctx.lineTo(539.74, 144.67);
    ctx.stroke();

    // Parede direita baixo + base
    ctx.beginPath();
    ctx.moveTo(539.74, 255.67);
    ctx.lineTo(539.74, 410.67);
    ctx.lineTo(60.74, 410.67);
    ctx.stroke();

    // Borda inferior extra (rodapé)
    ctx.fillStyle = colors.wall;
    ctx.fillRect(60.74, 408, 479, 4);

    // Lousa / Blackboard (estilo SVG — roxo escuro com borda dourada)
    ctx.fillStyle = colors.whiteboard;
    ctx.strokeStyle = colors.boardBorder;
    ctx.lineWidth = 4;
    ctx.fillRect(214.74, 2, 111, 38);
    ctx.strokeRect(214.74, 2, 111, 38);
    // Texto na lousa
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STORE LAYOUT', 270, 21);

    // Janelas (estilo SVG — azul céu com moldura dourada)
    ctx.fillStyle = colors.window;
    ctx.strokeStyle = colors.boardBorder;
    ctx.lineWidth = 3;
    // Janela esquerda
    ctx.fillRect(130, 5, 35, 32);
    ctx.strokeRect(130, 5, 35, 32);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(147.5, 5); ctx.lineTo(147.5, 37); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(130, 21); ctx.lineTo(165, 21); ctx.stroke();

    // Janela direita
    ctx.fillStyle = colors.window;
    ctx.strokeStyle = colors.boardBorder;
    ctx.lineWidth = 3;
    ctx.fillRect(370, 5, 35, 32);
    ctx.strokeRect(370, 5, 35, 32);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(387.5, 5); ctx.lineTo(387.5, 37); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(370, 21); ctx.lineTo(405, 21); ctx.stroke();

    // Relógio
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(340, 20, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Ponteiros
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(340, 20); ctx.lineTo(340, 13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(340, 20); ctx.lineTo(345, 20); ctx.stroke();

    // Armário triangular (canto superior esquerdo)
    ctx.fillStyle = colors.boardBorder;
    ctx.beginPath();
    ctx.moveTo(0.74, 0.67);
    ctx.lineTo(59.37, 0.67);
    ctx.lineTo(0.74, 65.33);
    ctx.closePath();
    ctx.fill();
    // Borda do armário
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Prateleiras internas
    ctx.strokeStyle = '#A0764A';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(3, 18); ctx.lineTo(40, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, 38); ctx.lineTo(22, 22); ctx.stroke();

    // Arco da porta de entrada
    ctx.strokeStyle = colors.wall;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(60.74, 410.17, 60, Math.PI, Math.PI * 0.5, true);
    ctx.stroke();
    ctx.setLineDash([]);

    // Porta aberta
    ctx.strokeStyle = colors.wall;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(60.74, 410.17);
    ctx.lineTo(60.74, 470.17);
    ctx.stroke();

    // Extintor (canto direito superior)
    ctx.fillStyle = colors.red;
    ctx.beginPath();
    ctx.roundRect(525, 8, 8, 28, 2);
    ctx.fill();
}

function drawTeacherDesk() {
    const tx = teacherDesk.x, ty = teacherDesk.y, tw = teacherDesk.w, th = teacherDesk.h;

    // Tampo claro (estilo SVG — topo da mesa)
    ctx.fillStyle = teacherDesk.isHovered ? colors.woodHover : colors.teacherDeskTop;
    ctx.fillRect(tx, ty, tw, 12);

    // Corpo escuro da mesa
    ctx.fillStyle = teacherDesk.isHovered ? colors.woodHover : colors.teacherDesk;
    ctx.fillRect(tx, ty + 12, tw, th - 12);

    // Notebook (estilo pixel)
    ctx.fillStyle = colors.cyan;
    ctx.fillRect(tx + 40, ty + 16, 22, 14);
    ctx.fillStyle = '#4AA8C7';
    ctx.fillRect(tx + 44, ty + 27, 14, 3);

    // Item vermelho na mesa (livro/caderno)
    ctx.fillStyle = colors.red;
    ctx.fillRect(tx + 10, ty + 18, 18, 10);

}

function drawDesks() {
    desks.forEach(desk => {
        // Corpo escuro da mesa
        ctx.fillStyle = desk.isHovered ? colors.woodHover : colors.woodBase;
        ctx.strokeStyle = colors.woodBorder;
        ctx.lineWidth = 1.5;

        if (desk.isHovered) {
            ctx.shadowColor = 'rgba(190, 38, 51, 0.5)';
            ctx.shadowBlur = 12;
        }

        desk.paths.forEach(path => {
            ctx.fill(path);
            ctx.stroke(path);
        });

        ctx.shadowColor = 'transparent';

        // Tampo claro no centro (efeito topo de madeira SVG)
        ctx.fillStyle = desk.isHovered ? '#E8566A' : colors.woodTop;
        ctx.beginPath();
        ctx.arc(desk.centerX, desk.centerY, 14, 0, Math.PI * 2);
        ctx.fill();

        // Pontinho decorativo
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.arc(desk.centerX, desk.centerY, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(91, 110, 225, ${r.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        r.radius += 1.5;
        r.alpha -= 0.03;

        if (r.alpha <= 0) {
            ripples.splice(i, 1);
        }
    }
}

function drawSigns() {
    signs.forEach(sign => {
        const isActive = sign.isHovered || dragTarget === sign;

        // Sombra
        ctx.shadowColor = isActive ? 'rgba(91, 110, 225, 0.5)' : 'rgba(63, 63, 116, 0.3)';
        ctx.shadowBlur = isActive ? 10 : 5;
        ctx.shadowOffsetY = isActive ? 3 : 1;

        // Fundo (estilo storage do SVG — roxo escuro / azul)
        ctx.fillStyle = isActive ? colors.accent : colors.whiteboard;
        ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
        ctx.shadowColor = 'transparent';

        // Borda (estilo SVG)
        ctx.strokeStyle = isActive ? '#7B8EF5' : colors.wall;
        ctx.lineWidth = 2;
        ctx.strokeRect(sign.x, sign.y, sign.w, sign.h);

        // Faixa superior dourada (como a moldura do quadro)
        ctx.fillStyle = isActive ? colors.yellow : colors.boardBorder;
        ctx.fillRect(sign.x, sign.y, sign.w, 3);

        // Texto branco
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sign.text, sign.x + sign.w / 2, sign.y + sign.h / 2 + 2);
    });
}

function drawTeacher() {
    const time = Date.now();
    const t = teacher;
    let pulse = 0;

    if (t.isSelected) {
        pulse = Math.sin(time / 150) * 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 4 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217, 160, 102, 0.4)';
        ctx.fill();
    }

    if (teacherImage.complete && teacherImage.naturalWidth > 0) {
        const size = t.radius * 2;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(teacherImage, t.x - t.radius, t.y - t.radius, size, size);
        ctx.shadowColor = 'transparent';
    } else {
        // Fallback
        ctx.fillStyle = t.isHovered ? colors.accent : colors.whiteboard;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.wall;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', t.x, t.y + 1);
    }
}

function drawStudents() {
    const time = Date.now();

    students.forEach(student => {
        let pulse = 0;
        if (student.isSelected) {
            pulse = Math.sin(time / 150) * 2;

            ctx.beginPath();
            ctx.arc(student.x, student.y, student.radius + 4 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(91, 110, 225, 0.35)';
            ctx.fill();
        }

        if (studentImage.complete && studentImage.naturalWidth > 0) {
            const size = student.radius * 2;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
            ctx.drawImage(studentImage, student.x - student.radius, student.y - student.radius, size, size);
            ctx.shadowColor = 'transparent';
        } else {
            ctx.beginPath();
            ctx.arc(student.x, student.y, student.radius, 0, Math.PI * 2);
            ctx.fillStyle = colors.accent;
            ctx.fill();
        }
    });
}

// --- 3. LÓGICA DE MOVIMENTO E LOOP ---

function updatePositions() {
    [teacher, ...students].forEach(char => {
        const dx = char.targetX - char.x;
        const dy = char.targetY - char.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const easing = 0.08;
            char.x += dx * easing;
            char.y += dy * easing;
        } else {
            char.x = char.targetX;
            char.y = char.targetY;
        }
    });
}

function gameLoop() {
    updatePositions();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFloorAndWalls();
    drawTeacherDesk();
    drawDesks();
    drawRipples();
    drawTeacher();
    drawStudents();
    drawSigns();

    requestAnimationFrame(gameLoop);
}

// --- 4. INTERATIVIDADE E EVENTOS ---

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;

    if (dragTarget) {
        dragTarget.x = mouseX - dragOffsetX;
        dragTarget.y = mouseY - dragOffsetY;
        hasDragged = true;
        canvas.style.cursor = 'grabbing';
        tooltip.style.opacity = '0';
        return;
    }

    let isAnyHovered = false;
    let hoveredName = "";
    let hoverIcon = "";

    // Plaquinhas (maior prioridade)
    signs.forEach(sign => {
        if (mouseX >= sign.x && mouseX <= sign.x + sign.w &&
            mouseY >= sign.y && mouseY <= sign.y + sign.h) {
            sign.isHovered = true;
            isAnyHovered = true;
            hoveredName = `Tag: ${sign.text}`;
            hoverIcon = "\uD83C\uDFF7\uFE0F";
        } else {
            sign.isHovered = false;
        }
    });

    // Teacher + Alunos
    if (!isAnyHovered) {
        // Teacher primeiro
        const dtx = mouseX - teacher.x;
        const dty = mouseY - teacher.y;
        if (Math.sqrt(dtx * dtx + dty * dty) <= teacher.radius + 3) {
            teacher.isHovered = true;
            isAnyHovered = true;
            hoveredName = 'Teacher';
            hoverIcon = "\uD83D\uDC69\u200D\uD83C\uDFEB";
        } else {
            teacher.isHovered = false;
        }

        // Alunos
        students.forEach(student => {
            if (!isAnyHovered) {
                const dx = mouseX - student.x;
                const dy = mouseY - student.y;
                if (Math.sqrt(dx * dx + dy * dy) <= student.radius + 3) {
                    student.isHovered = true;
                    isAnyHovered = true;
                    hoveredName = `Student: ${student.id}`;
                    hoverIcon = "\uD83D\uDC7B";
                } else {
                    student.isHovered = false;
                }
            } else {
                student.isHovered = false;
            }
        });
    } else {
        teacher.isHovered = false;
        students.forEach(student => student.isHovered = false);
    }

    // Mesa do professor
    if (!isAnyHovered && mouseX >= teacherDesk.x && mouseX <= teacherDesk.x + teacherDesk.w &&
        mouseY >= teacherDesk.y && mouseY <= teacherDesk.y + teacherDesk.h) {
        teacherDesk.isHovered = true;
        isAnyHovered = true;
        hoveredName = teacherDesk.id;
        hoverIcon = "\uD83D\uDC69\u200D\uD83C\uDFEB";
    } else {
        teacherDesk.isHovered = false;
    }

    // Mesas dos grupos
    desks.forEach(desk => {
        desk.isHovered = false;
        if (!isAnyHovered) {
            for (const path of desk.paths) {
                if (ctx.isPointInPath(path, mouseX, mouseY)) {
                    desk.isHovered = true;
                    isAnyHovered = true;
                    hoveredName = desk.id;
                    hoverIcon = "\uD83E\uDE91";
                    break;
                }
            }
        }
    });

    // Tooltip
    if (isAnyHovered) {
        const isOverSign = signs.some(s => s.isHovered);
        canvas.style.cursor = isOverSign ? 'grab' : 'pointer';

        tooltipText.textContent = hoveredName;
        tooltipIcon.textContent = hoverIcon;
        tooltip.style.opacity = '1';

        const containerRect = tooltip.parentElement.getBoundingClientRect();
        tooltip.style.left = `${e.clientX - containerRect.left}px`;
        tooltip.style.top = `${e.clientY - containerRect.top - 15}px`;
    } else {
        canvas.style.cursor = 'crosshair';
        tooltip.style.opacity = '0';
    }
});

canvas.addEventListener('mouseleave', () => {
    teacherDesk.isHovered = false;
    teacher.isHovered = false;
    desks.forEach(d => d.isHovered = false);
    students.forEach(s => s.isHovered = false);
    signs.forEach(s => s.isHovered = false);
    dragTarget = null;
    tooltip.style.opacity = '0';
});

// Drag and Drop das Plaquinhas
canvas.addEventListener('mousedown', () => {
    hasDragged = false;

    for (let i = signs.length - 1; i >= 0; i--) {
        const sign = signs[i];
        if (mouseX >= sign.x && mouseX <= sign.x + sign.w &&
            mouseY >= sign.y && mouseY <= sign.y + sign.h) {

            dragTarget = sign;
            dragOffsetX = mouseX - sign.x;
            dragOffsetY = mouseY - sign.y;

            signs.splice(i, 1);
            signs.push(dragTarget);

            canvas.style.cursor = 'grabbing';
            tooltip.style.opacity = '0';
            break;
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (dragTarget) {
        dragTarget = null;
        canvas.style.cursor = 'grab';
    }
});

// Controle de Clique
canvas.addEventListener('click', () => {
    if (hasDragged) return;
    if (signs.some(s => s.isHovered)) return;

    const allChars = [teacher, ...students];
    let clickedOnChar = false;

    // Selecionar personagem (teacher ou aluno)
    allChars.forEach(char => {
        if (char.isHovered) {
            allChars.forEach(c => c.isSelected = false);
            char.isSelected = true;
            clickedOnChar = true;
        }
    });

    // Mover personagem selecionado
    if (!clickedOnChar) {
        const selected = allChars.find(c => c.isSelected);

        if (selected) {
            let targetX, targetY;
            let targetSet = false;

            const clickedDesk = desks.find(d => d.isHovered);
            if (clickedDesk) {
                targetX = clickedDesk.centerX;
                targetY = clickedDesk.centerY;
                targetSet = true;
            }
            else if (teacherDesk.isHovered) {
                targetX = teacherDesk.x + teacherDesk.w / 2;
                targetY = teacherDesk.y + teacherDesk.h + 20;
                targetSet = true;
            }
            else if (mouseX >= 1 && mouseX <= 539 && mouseY >= 1 && mouseY <= 410) {
                targetX = mouseX;
                targetY = mouseY;
                targetSet = true;
            }

            if (targetSet) {
                selected.targetX = targetX;
                selected.targetY = targetY;
                selected.isSelected = false;
                ripples.push({ x: targetX, y: targetY, radius: 5, alpha: 1 });
            }
        } else if (teacherDesk.isHovered || desks.some(d => d.isHovered)) {
            tooltipText.textContent = "Select a character first!";
            tooltipIcon.textContent = "\u26A0\uFE0F";
            tooltip.style.opacity = '1';
            setTimeout(() => {
                if (tooltipText.textContent.includes("Select")) tooltip.style.opacity = '0';
            }, 1500);
        }
    }
});

// Inicia
gameLoop();
