// Unicode pieces for white and black
const PIECES = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

// Initial board setup (rank-file: piece)
const initialSetup = {
    '1_1': 'wR', '2_1': 'wN', '3_1': 'wB', '4_1': 'wQ', '5_1': 'wK', '6_1': 'wB', '7_1': 'wN', '8_1': 'wR',
    '1_2': 'wP', '2_2': 'wP', '3_2': 'wP', '4_2': 'wP', '5_2': 'wP', '6_2': 'wP', '7_2': 'wP', '8_2': 'wP',
    '1_7': 'bP', '2_7': 'bP', '3_7': 'bP', '4_7': 'bP', '5_7': 'bP', '6_7': 'bP', '7_7': 'bP', '8_7': 'bP',
    '1_8': 'bR', '2_8': 'bN', '3_8': 'bB', '4_8': 'bQ', '5_8': 'bK', '6_8': 'bB', '7_8': 'bN', '8_8': 'bR'
};

let board = {};
let selected = null;
let turn = 'white';
let playerNames = { white: "Aditya", black: "Aman" };

// Render the board pieces
function renderBoard() {
    for (let y = 1; y <= 8; y++) {
        for (let x = 1; x <= 8; x++) {
            const id = `${x}_${y}`;
            const cell = document.getElementById(id);
            const piece = board[id];
            cell.textContent = piece ? PIECES[piece] : '';
            cell.style.outline = '';
            cell.classList.remove('capture-anim', 'move-anim', 'highlight-move');
        }
    }
}

// Initialize board state
function resetBoard() {
    board = {};
    Object.assign(board, initialSetup);
    renderBoard();
    turn = 'white';
    document.getElementById('turn').textContent = `Your turn, ${playerNames.white}!`;
    selected = null;
}
resetBoard();

// Animation CSS
if (!document.getElementById('chess-anim-style')) {
    const style = document.createElement('style');
    style.id = 'chess-anim-style';
    style.innerHTML = `
    .capture-anim {
        animation: captureAnim 0.5s;
        background: #ff5252 !important;
    }
    @keyframes captureAnim {
        0% { background: #ff5252; }
        100% { background: inherit; }
    }
    .move-anim {
        animation: moveAnim 0.5s;
        background: #5cb85c !important;
    }
    @keyframes moveAnim {
        0% { background: #5cb85c; }
        100% { background: inherit; }
    }
    .highlight-move {
        box-shadow: 0 0 10px 3px #5cb85c;
    }
    `;
    document.head.appendChild(style);
}

// Utility functions
function getPieceColor(piece) {
    if (!piece) return null;
    return piece[0] === 'w' ? 'white' : 'black';
}
function getPieceName(piece) {
    if (!piece) return '';
    switch (piece[1]) {
        case 'K': return 'King';
        case 'Q': return 'Queen';
        case 'R': return 'Rook';
        case 'B': return 'Bishop';
        case 'N': return 'Knight';
        case 'P': return 'Pawn';
        default: return '';
    }
}

// Move validation (basic, no castling/en passant/promotion)
function isValidMove(from, to, piece) {
    if (!piece) return false;
    const [fx, fy] = from.split('_').map(Number);
    const [tx, ty] = to.split('_').map(Number);
    const dx = tx - fx;
    const dy = ty - fy;
    const destPiece = board[to];
    const color = getPieceColor(piece);

    // Don't capture own piece
    if (destPiece && getPieceColor(destPiece) === color) return false;

    switch (piece[1]) {
        case 'P': // Pawn
            if (color === 'white') {
                if (dx === 0 && dy === 1 && !destPiece) return true;
                if (fx === tx && fy === 2 && dy === 2 && !destPiece && !board[`${fx}_${fy+1}`]) return true;
                if (Math.abs(dx) === 1 && dy === 1 && destPiece && getPieceColor(destPiece) === 'black') return true;
            } else {
                if (dx === 0 && dy === -1 && !destPiece) return true;
                if (fx === tx && fy === 7 && dy === -2 && !destPiece && !board[`${fx}_${fy-1}`]) return true;
                if (Math.abs(dx) === 1 && dy === -1 && destPiece && getPieceColor(destPiece) === 'white') return true;
            }
            return false;
        case 'N': // Knight
            return (Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2);
        case 'B': // Bishop
            if (Math.abs(dx) !== Math.abs(dy)) return false;
            for (let i = 1; i < Math.abs(dx); i++) {
                const ix = fx + i * Math.sign(dx);
                const iy = fy + i * Math.sign(dy);
                if (board[`${ix}_${iy}`]) return false;
            }
            return true;
        case 'R': // Rook
            if (dx !== 0 && dy !== 0) return false;
            if (dx === 0) {
                for (let i = 1; i < Math.abs(dy); i++) {
                    const iy = fy + i * Math.sign(dy);
                    if (board[`${fx}_${iy}`]) return false;
                }
            } else {
                for (let i = 1; i < Math.abs(dx); i++) {
                    const ix = fx + i * Math.sign(dx);
                    if (board[`${ix}_${fy}`]) return false;
                }
            }
            return true;
        case 'Q': // Queen
            if (Math.abs(dx) === Math.abs(dy)) {
                for (let i = 1; i < Math.abs(dx); i++) {
                    const ix = fx + i * Math.sign(dx);
                    const iy = fy + i * Math.sign(dy);
                    if (board[`${ix}_${iy}`]) return false;
                }
                return true;
            }
            if (dx === 0 || dy === 0) {
                if (dx === 0) {
                    for (let i = 1; i < Math.abs(dy); i++) {
                        const iy = fy + i * Math.sign(dy);
                        if (board[`${fx}_${iy}`]) return false;
                    }
                } else {
                    for (let i = 1; i < Math.abs(dx); i++) {
                        const ix = fx + i * Math.sign(dx);
                        if (board[`${ix}_${fy}`]) return false;
                    }
                }
                return true;
            }
            return false;
        case 'K': // King
            return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
        default:
            return false;
    }
}

// Highlight possible moves
function highlightMoves(from, piece) {
    document.querySelectorAll('.gamcell').forEach(cell => {
        const to = cell.id;
        if (isValidMove(from, to, piece)) {
            cell.classList.add('highlight-move');
        }
    });
}

// Remove highlights
function removeHighlights() {
    document.querySelectorAll('.gamcell').forEach(cell => {
        cell.classList.remove('highlight-move');
    });
}

// Handle cell click
document.querySelectorAll('.gamcell').forEach(cell => {
    cell.addEventListener('click', function() {
        const id = this.id;
        const piece = board[id];

        // Select piece
        if (!selected) {
            if (piece && getPieceColor(piece) === turn) {
                selected = id;
                this.style.outline = '2px solid orange';
                highlightMoves(id, piece);
            }
        } else {
            // Move to same color piece: reselect
            if (piece && getPieceColor(piece) === turn) {
                document.getElementById(selected).style.outline = '';
                removeHighlights();
                selected = id;
                this.style.outline = '2px solid orange';
                highlightMoves(id, piece);
                return;
            }
            // Try to move
            const from = selected;
            const to = id;
            const movingPiece = board[from];
            if (isValidMove(from, to, movingPiece)) {
                // If capture, show animation and message
                if (board[to]) {
                    this.classList.add('capture-anim');
                    const cutName = getPieceName(board[to]);
                    document.getElementById('turn').textContent =
                        `${playerNames[turn]} cut ${playerNames[turn === 'white' ? 'black' : 'white']}'s ${cutName}!`;
                    setTimeout(() => {
                        this.classList.remove('capture-anim');
                        turn = (turn === 'white') ? 'black' : 'white';
                        document.getElementById('turn').textContent =
                            `Your turn, ${playerNames[turn]}!`;
                    }, 1200);
                } else {
                    this.classList.add('move-anim');
                    setTimeout(() => this.classList.remove('move-anim'), 500);
                    turn = (turn === 'white') ? 'black' : 'white';
                    document.getElementById('turn').textContent =
                        `Your turn, ${playerNames[turn]}!`;
                }
                board[to] = movingPiece;
                delete board[from];
                document.getElementById(from).style.outline = '';
                selected = null;
                renderBoard();
                removeHighlights();
            } else {
                // Invalid move, just deselect
                document.getElementById(selected).style.outline = '';
                removeHighlights();
                selected = null;
            }
        }
    });
});

// Optional: Reset board on double click anywhere
document.getElementById('game').addEventListener('dblclick', () => {
    resetBoard();
    removeHighlights();
});