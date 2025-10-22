document.addEventListener('DOMContentLoaded', () => {
    const gameModal = document.getElementById('game-modal');
    const openGameBtn = document.getElementById('open-game-btn');
    const closeBtn = document.querySelector('.close-btn');
    const gameArea = document.getElementById('game-area'); 
    const bins = document.querySelectorAll('.bin');
    const resultMessage = document.getElementById('result-message');
    const flashOverlay = document.getElementById('green-flash');
    const flashLogo = document.getElementById('flash-logo');

    let totalItems = 0;
    let itemsDropped = 0;
    let correctDrops = 0;

    const TRANSITION_DURATION_MS = 2000; // 2 segundos (2000ms) - Duração total da transição de saída
    const FLASH_ERROR_DURATION_MS = 100; // 100ms - Piscar Vermelho no Erro
    const MIN_SUCCESS_PERCENTAGE = 50; // Limite para transição verde (acertar 50% ou mais)

    const allTrashItems = Array.from(document.querySelectorAll('.trash-item'));

    openGameBtn.addEventListener('click', () => {
        gameModal.style.display = 'block';
        resetGame();
        startGame();
    });

    closeBtn.addEventListener('click', () => {
        // Ao fechar, verifica se o jogo já terminou. Se sim, usa o resultado final. Se não, usa 0% de acerto (transição vermelha).
        const percentage = totalItems > 0 && itemsDropped === totalItems ? Math.round((correctDrops / totalItems) * 100) : 0;
        const isSuccessTransition = percentage >= MIN_SUCCESS_PERCENTAGE;
        closeGameWithFlashTransition(isSuccessTransition); 
    });

    window.addEventListener('click', (event) => {
        if (event.target === gameModal) {
            // Se clicar fora do modal, fecha com a transição padrão (vermelha se o jogo não terminou)
            const percentage = totalItems > 0 && itemsDropped === totalItems ? Math.round((correctDrops / totalItems) * 100) : 0;
            const isSuccessTransition = percentage >= MIN_SUCCESS_PERCENTAGE;
            closeGameWithFlashTransition(isSuccessTransition); 
        }
    });

    /**
     * Inicia a transição de tela cheia para fechar o modal.
     * @param {boolean} isSuccessTransition - true para flash verde, false para flash vermelho.
     */
    function closeGameWithFlashTransition(isSuccessTransition) {
        // Se o flash já estiver ativo, impede que a função seja chamada novamente.
        if (flashOverlay.classList.contains('active')) return;

        // 1. Define a classe da transição (Verde ou Vermelha, mais lenta)
        flashOverlay.classList.remove('error-flash'); // Limpa o flash rápido de erro
        
        if (isSuccessTransition) {
            flashOverlay.classList.remove('fail-transition');
            flashOverlay.classList.add('success-transition');
        } else {
            flashOverlay.classList.remove('success-transition');
            flashOverlay.classList.add('fail-transition');
        }

        // 2. ATIVA O FLASH E O LOGO
        flashLogo.classList.remove('hidden'); 
        flashOverlay.classList.add('active'); 
        
        // 3. PROGRAMA O FECHAMENTO DO JOGO APÓS A DURAÇÃO (2 segundos)
        setTimeout(() => {
            gameModal.style.display = 'none';
            resetGame(); 
        }, TRANSITION_DURATION_MS); 
    }

    function resetGame() {
        itemsDropped = 0;
        correctDrops = 0;
        resultMessage.style.display = 'none';
        
        document.querySelectorAll('.confetti').forEach(c => c.remove());
        // Limpa todas as classes de flash
        flashOverlay.classList.remove('active', 'fail-transition', 'success-transition', 'error-flash'); 
        flashLogo.classList.add('hidden'); 
        
        allTrashItems.forEach(item => {
            item.classList.remove('dropped', 'dragging');
            item.style.top = '-100px'; 
            item.style.opacity = 1; 
            item.style.pointerEvents = 'auto'; 
            item.style.transition = 'none'; 
            
            if (item.parentNode) {
                item.parentNode.removeChild(item);
            }
        });

        totalItems = allTrashItems.length;
    }

    function startGame() {
        allTrashItems.forEach((item, index) => {
            const delay = 500 + (index * 400); 
            const horizontalPos = Math.random() * (gameArea.clientWidth - 80); 
            
            gameArea.appendChild(item);
            
            setTimeout(() => {
                item.style.transition = 'none'; 
                item.style.left = `${horizontalPos}px`;
                item.style.top = '-100px'; 

                setTimeout(() => {
                    item.style.transition = 'top 12s linear, transform 0.5s, opacity 0.5s'; 
                    item.style.top = `${gameArea.clientHeight - item.clientHeight - 50}px`; 
                }, 50); 
            }, delay);
        });
        
        setupDragAndDrop();
    }

    // --- DRAG AND DROP HANDLERS (Omitidos para brevidade, mantenha os do código anterior) ---
    function setupDragAndDrop() {
        allTrashItems.forEach(item => {
            item.addEventListener('dragstart', dragStart);
            item.addEventListener('dragend', dragEnd);
        });

        bins.forEach(bin => {
            bin.addEventListener('dragover', dragOver);
            bin.addEventListener('dragenter', dragEnter);
            bin.addEventListener('dragleave', dragLeave);
            bin.addEventListener('drop', drop);
        });
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging'); 
        e.dataTransfer.setDragImage(e.target, 30, 30);
    }
    
    function dragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function dragOver(e) {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drag-over'); 
    }

    function dragLeave(e) {
        this.classList.remove('drag-over');
    }

    // --- FUNÇÃO DROP (Com flashes individuais) ---
    function drop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const draggedItem = document.querySelector('.trash-item.dragging');
        if (!draggedItem || draggedItem.classList.contains('dropped')) return; 

        const binType = this.dataset.accept;
        const itemType = draggedItem.dataset.type;

        itemsDropped++;

        if (binType === itemType) {
            correctDrops++;
            showMessage('🎉 Certo! ' + itemType.toUpperCase() + ' no lugar correto.', true);
            
            // Flash Verde em cada acerto individual (300ms)
            // Remove qualquer classe de erro antes de aplicar o flash de acerto
            flashOverlay.classList.remove('error-flash', 'fail-transition', 'success-transition');
            flashOverlay.classList.add('active'); 
            setTimeout(() => {
                flashOverlay.classList.remove('active');
            }, 300); 

        } else {
            showMessage('❌ Errado! Isso é ' + itemType.toUpperCase() + ' e deve ir em ' + binType.toUpperCase() + '.', false);
            
            // Flash Vermelho Rápido no Erro
            flashOverlay.classList.remove('success-transition', 'fail-transition');
            flashOverlay.classList.add('error-flash', 'active'); 
            setTimeout(() => {
                flashOverlay.classList.remove('error-flash', 'active');
            }, FLASH_ERROR_DURATION_MS); 
        }

        // 2. REMOVE O ITEM DO JOGO
        draggedItem.classList.add('dropped');
        draggedItem.style.pointerEvents = 'none'; 
        draggedItem.classList.remove('dragging'); 
        draggedItem.style.opacity = 0; 
        
        // 3. VERIFICA SE O JOGO ACABOU
        if (itemsDropped === totalItems) {
            endGame();
        }
    }

    function showMessage(msg, isCorrect) {
        resultMessage.textContent = msg;
        resultMessage.style.backgroundColor = isCorrect ? 'rgba(0, 128, 0, 0.9)' : 'rgba(220, 53, 69, 0.9)';
        resultMessage.style.color = 'white';
        resultMessage.style.display = 'block';

        setTimeout(() => {
            resultMessage.style.display = 'none';
        }, 1000);
    }
    
    // --- FUNÇÃO DE CONFETE (Omitida para brevidade, mantenha a do código anterior) ---
    function createConfettiExplosion() {
        const colors = ['#f44336', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'];
        const numConfetti = 80;

        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.left = `${50 + (Math.random() * 20 - 10)}%`; 
            confetti.style.top = '10%'; 

            const velocityX = (Math.random() - 0.5) * 15; 
            const rotationSpeed = (Math.random() - 0.5) * 1000;

            confetti.style.setProperty('--vx', `${velocityX}px`);
            confetti.style.setProperty('--rs', `${rotationSpeed}deg`);

            gameModal.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 3000); 
        }
    }

    // --- FUNÇÃO ENDGAME (Com lógica de transição final) ---
    function endGame() {
        let finalMsg;
        const percentage = Math.round((correctDrops / totalItems) * 100);
        // Transição VERDE se acertar 50% ou mais
        const isSuccessTransition = percentage >= MIN_SUCCESS_PERCENTAGE; 

        if (percentage === 100) {
            finalMsg = `PERFEITO! Você acertou 100% dos ${totalItems} itens e salvou o planeta! 🌍✨`;
            createConfettiExplosion(); 
        } else {
            finalMsg = `Fim de jogo! Você acertou ${correctDrops} de ${totalItems} (${percentage}%). Tente novamente!`;
        }

        // Exibe a mensagem final
        resultMessage.textContent = finalMsg;
        resultMessage.style.backgroundColor = 'white';
        resultMessage.style.color = '#343a40';
        resultMessage.style.border = '3px solid #008000';
        resultMessage.style.display = 'block';
        
        // Remove a mensagem antes da transição de saída
        setTimeout(() => {
            resultMessage.style.display = 'none';
        }, 1500);
        
        // CHAMA A FUNÇÃO DE TRANSIÇÃO APÓS A MENSAGEM FINAL SER VISTA (2 segundos)
        setTimeout(() => {
             closeGameWithFlashTransition(isSuccessTransition);
        }, 2000); 
    }

    setupDragAndDrop();
    resetGame();
});