const isMobile = document.documentElement.clientWidth < 768;
const isTablet = document.documentElement.clientWidth < 1140;

function initDgagCanvas() {
    // DOM elements
    const draggable = $('.drag-canvas__draggable').get(0);
    const container = $('.drag-canvas').get(0);
    const compass = $('.compass').get(0);

    // Rectsngles
    const containerRect = container.getBoundingClientRect();
    const draggableRect = draggable.getBoundingClientRect();
    
    // State variables
    let isDragging = false;
    let startX, startY;
    let offsetX = 0, offsetY = 0;
    let velocityX = 0, velocityY = 0;
    let lastX, lastY;
    let timestamp, lastTimestamp;
    let animationId;
    
    // Configurable parameters
    let friction = 0.93;
    let maxSpeed = 20;
    
    // Initialize position
    resetPosition();
    
    
    // Mouse/touch event handlers
    draggable.addEventListener('mousedown', startDrag);
    draggable.addEventListener('touchstart', startDrag, { passive: false });
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    compass.addEventListener('click', resetPosition);
    
    // Prevent default touch behavior to avoid scrolling
    document.addEventListener('touchmove', e => {
        if (isDragging) e.preventDefault();
    }, { passive: false });

    resetPosition();
    
    // Initialize animation loop
    requestAnimationFrame(animate);
    
    // Functions
    function startDrag(e) {
        isDragging = true;
        draggable.style.cursor = 'grabbing';
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        startX = clientX - offsetX;
        startY = clientY - offsetY;
        
        // Reset velocity
        velocityX = 0;
        velocityY = 0;
        
        // Cancel any ongoing animation
        cancelAnimationFrame(animationId);
        
        // Store initial timestamp
        timestamp = performance.now();
        lastTimestamp = timestamp;
        lastX = clientX;
        lastY = clientY;

        // compass.style.transition = '.3s';
        // $(compass).removeClass('compass_hidden');

        // setTimeout(() => {
        //     compass.style.transition = '0s';
        // }, 300)
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        // Calculate new position
        offsetX = clientX - startX;
        offsetY = clientY - startY;

        // Calculate velocity (for inertia)
        const now = performance.now();
        const deltaTime = now - lastTimestamp;
        
        if (deltaTime > 0) {
            const deltaX = clientX - lastX;
            const deltaY = clientY - lastY;
            
            velocityX = deltaX / deltaTime * 16; // Normalize to ~60fps
            velocityY = deltaY / deltaTime * 16;
            
            // Limit maximum speed
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (speed > maxSpeed) {
                const ratio = maxSpeed / speed;
                velocityX *= ratio;
                velocityY *= ratio;
            }
        }

        // Calculate max offsets to keep draggable within viewport
        const maxOffsetX = containerRect.width - draggableRect.width;
        const maxOffsetY = containerRect.height - draggableRect.height;
        
        // Clamp values
        if(offsetX > 0 || offsetX < maxOffsetX) {
            velocityX = 0;
        }
        if(offsetY > 0 || offsetY < maxOffsetY) {
            velocityY = 0;
        }
        offsetX = Math.min(0, Math.max(maxOffsetX, offsetX));
        offsetY = Math.min(0, Math.max(maxOffsetY, offsetY));

        // Update element position
        draggable.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        lastX = clientX;
        lastY = clientY;
        lastTimestamp = now;

        updateCompass(offsetX, offsetY);
    }
    
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        draggable.style.cursor = 'grab';
        
        // Start inertia animation
        animate();
    }
    
    function animate() {
        if (!isDragging) {
            // Apply friction to velocity
            velocityX *= friction;
            velocityY *= friction;
            
            // Update position based on velocity
            offsetX += velocityX;
            offsetY += velocityY;
            
            // Calculate max offsets to keep draggable within viewport
            const maxOffsetX = containerRect.width - draggableRect.width;
            const maxOffsetY = containerRect.height - draggableRect.height;
            
            // Clamp values
            offsetX = Math.min(0, Math.max(maxOffsetX, offsetX));
            offsetY = Math.min(0, Math.max(maxOffsetY, offsetY));
            
            // Update element position
            draggable.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            // Continue animation if there's still significant movement
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (speed > 0.1) {
                animationId = requestAnimationFrame(animate);
            }

            updateCompass(offsetX, offsetY);
        }
    }
    
    function resetPosition() {
        // Cancel any ongoing animation
        cancelAnimationFrame(animationId);
        
        // Reset position to center
        offsetX = (containerRect.width / 2) - (draggableRect.width / 2);
        offsetY = (containerRect.height / 2) - (draggableRect.height / 2);
        
        // Reset velocity
        velocityX = 0;
        velocityY = 0;
        
        // Update element position
        draggable.style.transition = '.3s';
        draggable.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        compass.style.transition = '.3s';
        compass.style.transform = `rotate(0deg)`;

        setTimeout(() => {
            draggable.style.transition = '0s';
            compass.style.transition = '0s';
        }, 300);
    }
    
    function angleWithVertical2D(x, y) {
        // Проверяем, что вектор не нулевой
        if (x === 0 && y === 0) {
            return 0;
        }
        
        // Вычисляем угол через atan2
        const angle = Math.atan2(x, y);
        
        // Переводим в градусы и корректируем
        let result = (90 - angle * (180 / Math.PI) + 360) % 360;
        return -result + 135;
    }

    function updateCompass(offsetX, offsetY) {
        centerX = (containerRect.width / 2) - (draggableRect.width / 2);
        centerY = (containerRect.height / 2) - (draggableRect.height / 2);

        vectorX = offsetX - centerX;
        vectorY = centerY - offsetY;

        let angle = angleWithVertical2D(vectorX, vectorY);
        compass.style.transform = `rotate(${angle}deg)`;
    }
}

function initRuler() {
    const container = $('.drag-canvas').get(0);
    const containerRect = container.getBoundingClientRect();

    let markCountX =  containerRect.width / 35;
    let lineX = $('.drag-canvas__lineX');
    for(let i = 0; i < markCountX; i++) {
        lineX.append(`<div class="drag-canvas__line-text">${i}</div>`);
    }

    let markCountY =  containerRect.height / 35;
    let lineY = $('.drag-canvas__lineY');
    for(let i = 0; i < markCountY; i++) {
        lineY.append(`<div class="drag-canvas__line-text drag-canvas__line-text_y">${i}</div>`);
    }

}

function initForWhoTabs() {
    const contentNodes = $('.for-who__content')
    $('.for-who__list-elem').each(function(index) {
        $(this).on('click', function(event) {
            $('.for-who__list-elem_active').removeClass('for-who__list-elem_active');
            $(this).addClass('for-who__list-elem_active');

            let currentNode = contentNodes.get(index);
            $('.for-who__content_active').removeClass('for-who__content_active');
            $(currentNode).addClass('for-who__content_active');
        })
    })
}

function initPayTabs() {
    let payPriceNode = $('.pay__price');
    let payTextNode = $('.pay__text');
    let graphNode = $('.pay__graph');

    $('.pay__btn').on('click', function (event){
        let price = $(this).data('price');
        let text = $(this).data('text');
        let graphClass = $(this).data('graph');

        $('.pay__btn_active').removeClass('pay__btn_active');
        $(this).addClass('pay__btn_active');

        payPriceNode.addClass('pay__price_hidden');
        payTextNode.addClass('pay__text_hidden');


        setTimeout(() => {
            payPriceNode.text(price);
            payTextNode.text(text);

            payPriceNode.removeClass('pay__price_hidden');
            payTextNode.removeClass('pay__text_hidden');
        }, 300)

        graphNode.removeClass('pay__graph_grow');
        graphNode.removeClass('pay__graph_shrink');
        graphNode.removeClass('pay__graph_normal');
        graphNode.addClass('pay__graph_' + graphClass);
    })

    $('.pay__btn').get(0).click();
}

$( document ).ready(function() {
    initDgagCanvas();
    initRuler();
    initForWhoTabs();
    initPayTabs();
});