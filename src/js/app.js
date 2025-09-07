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
        if($(e.target).hasClass('sky-blocks__elem')) {
            return;
        }
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

function initSkyBlocks() {
    let $this = document.querySelector("#sky-blocks");
    if (!$this) {
        return;
    }
    let Engine = Matter.Engine
      , Render = Matter.Render
      , Runner = Matter.Runner
      , Bodies = Matter.Bodies
      , World = Matter.World
      , Mouse = Matter.Mouse
      , MouseConstraint = Matter.MouseConstraint;

    const params = {
        isStatic: true,
        restitution: 0.01,
        render: {
            fillStyle: "tranparent",
        }
    };
    const canvasSize = {
        width: $this.clientWidth,
        height: $this.clientHeight
    };
    const engine = Engine.create({});
    const render = Render.create({
        element: $this,
        engine: engine,
        options: {
            ...canvasSize,
            background: "transparent",
            wireframes: false
        }
    });
    const floor = Bodies.rectangle(canvasSize.width / 2, canvasSize.height, canvasSize.width, 20, params);
    const wall1 = Bodies.rectangle(0, canvasSize.height / 2, 20, canvasSize.height, params);
    const wall2 = Bodies.rectangle(canvasSize.width, canvasSize.height / 2, 20, canvasSize.height, params);
    const top = Bodies.rectangle(canvasSize.width / 2, 0, canvasSize.width, 20, params);
    const featureItems = $this.querySelectorAll(".sky-blocks__elem");
    const featureBodies = [...featureItems].map( (elemRef) => {
        const width = elemRef.offsetWidth;
        const height = elemRef.offsetHeight;
        elemRef.style.opacity = 1
        const randomX = Math.random() * (canvasSize.width - width) + width / 2;
        const randomY = 100;
        let item = Bodies.rectangle(randomX, randomY, width, height, {
            restitution: 0.01,
            render: {
                fillStyle: "transparent"
            },
        });
        return {
            body: item,
            elem: elemRef,
            render() {
                const {x, y} = this.body.position;
                this.elem.style.top = `${Math.abs(y - 20)}px`;
                this.elem.style.left = `${x - width / 2}px`;
                this.elem.style.transform = `rotate(${this.body.angle}rad)`;
            }
        };
    }
    );
    const mouse = Mouse.create($this);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
            stiffness: 0.1,
            damping: 0.1,
            render: {
                visible: false
            }
        }
    });
    mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener("wheel", mouseConstraint.mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);
    if ($(window).innerWidth() < 1200) {
        mouseConstraint.mouse.element.removeEventListener('touchstart', mouseConstraint.mouse.mousedown);
        mouseConstraint.mouse.element.removeEventListener('touchmove', mouseConstraint.mouse.mousemove);
        mouseConstraint.mouse.element.removeEventListener('touchend', mouseConstraint.mouse.mouseup);
        mouseConstraint.mouse.element.addEventListener('touchstart', mouseConstraint.mouse.mousedown, {
            passive: true
        });
        mouseConstraint.mouse.element.addEventListener('touchmove', (e) => {
            if (mouseConstraint.body) {
                mouseConstraint.mouse.mousemove(e);
            }
        }
        );
        mouseConstraint.mouse.element.addEventListener('touchend', (e) => {
            if (mouseConstraint.body) {
                mouseConstraint.mouse.mouseup(e);
            }
        }
        );
    }
    engine.positionIterations = 12;
    engine.velocityIterations = 10;
    engine.constraintIterations = 8;
    World.add(engine.world, [floor, ...featureBodies.map( (box) => box.body), wall1, wall2, top, mouseConstraint]);
    render.mouse = mouse;
    Runner.run(engine);
    Render.run(render);
    (function rerender() {
        featureBodies.forEach( (element) => {
            element.render();
        }
        );
        Engine.update(engine, 12);
        requestAnimationFrame(rerender);
    }
    )();
    Matter.Events.on(engine, 'beforeUpdate', () => {
        engine.world.bodies.forEach(body => {
            const maxSpeed = 5;
            const velocity = body.velocity;
            const speed = Math.sqrt(velocity.x * 2 + velocity.y * 2);
            if (speed > maxSpeed) {
                Matter.Body.setVelocity(body, {
                    x: (velocity.x / speed) * maxSpeed,
                    y: (velocity.y / speed) * maxSpeed,
                });
            }
        }
        );
    }
    );
}

$( document ).ready(function() {
    initDgagCanvas();
    initRuler();
    initForWhoTabs();
    initPayTabs();
    initSkyBlocks();
    
});