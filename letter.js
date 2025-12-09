// letters.js - Scrolling Letter Generator for 17th Century Chatbot

document.addEventListener('DOMContentLoaded', function() {
    console.log('Letters.js loaded - Starting initialization');
    
    // Get DOM elements
    const lettersContainer = document.createElement('div');
    lettersContainer.className = 'scrolling-letters';
    document.body.appendChild(lettersContainer);
    
    // Configuration
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const PARALLAX_FACTOR = 0.3;
    const MAX_LETTERS = 80; // Increased to handle more letters
    const LETTER_GENERATION_INTERVAL = 80;
    
    // State variables
    let letters = [];
    let lastScrollY = window.scrollY;
    let lastLetterGenerationTime = 0;
    let isActive = false;
    let generatedLetterCount = 0;
    let debugMode = true;
    
    // Store original positions for each letter
    let letterPositions = new Map();
    
    // Calculate trigger zones based on image positions
    function calculateTriggerZones() {
        const viewportHeight = window.innerHeight;
        
        // Image 2 starts at 100vh
        const startY = viewportHeight; 
        
        // Seventh image bottom: 700vh
        const endY = 7 * viewportHeight;
        
        if (debugMode) {
            console.log(`Viewport height: ${viewportHeight}px`);
            console.log(`Trigger zones: Start=${startY}px, End=${endY}px`);
        }
        
        return { startY, endY, viewportHeight };
    }
    
    // Check if we're in the active zone
    let triggerZones = calculateTriggerZones();
    
    // Create a letter element
    function createLetter(scrollY = lastScrollY) {
        const letter = document.createElement('div');
        letter.className = 'scroll-letter';
        
        // Random character
        const char = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        letter.textContent = char;
        
        // Random starting position at top of screen
        const startX = Math.random() * 90 + 5;
        const startY = -15 - Math.random() * 25;
        
        letter.style.left = `${startX}%`;
        letter.style.top = `${startY}%`;
        
        // Random slight rotation
        const rotation = Math.random() * 30 - 15;
        letter.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        
        // Force white color
        letter.style.color = '#ffffff';
        letter.style.textShadow = '0 0 10px #ffffff, 0 0 20px rgba(255, 255, 255, 0.8)';
        letter.style.opacity = '0.9';
        letter.style.fontSize = '2.2rem';
        letter.style.transition = 'opacity 0.5s ease';
        letter.style.position = 'absolute';
        
        // Add to container
        lettersContainer.appendChild(letter);
        
        // Store letter data with additional info for upward scrolling
        const letterData = {
            element: letter,
            startX: startX,
            startY: startY,
            startScrollY: scrollY, // Store the scroll position when created
            currentScrollY: scrollY,
            parallaxSpeed: 0.2 + Math.random() * 0.3,
            rotation: rotation,
            char: char,
            spawnTime: Date.now(),
            id: Date.now() + Math.random(), // Unique ID
            direction: 1, // 1 for down, -1 for up
            isVisible: true,
            baseTop: startY // Store base top position
        };
        
        letters.push(letterData);
        generatedLetterCount++;
        
        if (debugMode && generatedLetterCount % 10 === 0) {
            console.log(`Created letter #${generatedLetterCount} at scrollY=${scrollY}px`);
        }
        
        // Store original position
        letterPositions.set(letterData.id, {
            startX: startX,
            startY: startY,
            startScrollY: scrollY,
            rotation: rotation
        });
        
        // Remove oldest letter if we exceed maximum
        if (letters.length > MAX_LETTERS) {
            const oldestLetter = letters.shift();
            if (oldestLetter && oldestLetter.element && oldestLetter.element.parentNode) {
                letterPositions.delete(oldestLetter.id);
                oldestLetter.element.remove();
            }
        }
        
        return letterData;
    }
    
    // Update letter positions based on scroll (works for both up and down)
    function updateLetters() {
        const scrollY = window.scrollY;
        const scrollDelta = scrollY - lastScrollY;
        const isScrollingDown = scrollDelta > 0;
        const isScrollingUp = scrollDelta < 0;
        
        // Update trigger zones on resize
        if (window.innerHeight !== triggerZones.viewportHeight) {
            triggerZones = calculateTriggerZones();
        }
        
        // Check if we're in the active zone
        const wasActive = isActive;
        isActive = scrollY >= triggerZones.startY && scrollY <= triggerZones.endY;
        
        // If just entered active zone
        if (isActive && !wasActive) {
            console.log(`🎉 ENTERED LETTER ZONE!`);
            lettersContainer.style.opacity = '1';
            lettersContainer.style.pointerEvents = 'none';
            
            // Create initial burst of letters
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    if (letters.length < MAX_LETTERS) {
                        createLetter(scrollY);
                    }
                }, i * 30);
            }
        }
        
        // If just left active zone
        if (!isActive && wasActive) {
            console.log(`👋 LEFT LETTER ZONE`);
            lettersContainer.style.opacity = '0';
            // Fade out letters when leaving zone
            letters.forEach(letter => {
                if (letter.element) {
                    letter.element.style.opacity = '0';
                    letter.element.style.transition = 'opacity 0.8s ease';
                    setTimeout(() => {
                        if (letter.element && letter.element.parentNode) {
                            letter.element.remove();
                        }
                    }, 800);
                }
            });
            letters = [];
            letterPositions.clear();
        }
        
        // Only update letters if in active zone
        if (isActive) {
            // Create a copy of letters array to avoid mutation during iteration
            const lettersToUpdate = [...letters];
            
            // Update each letter position (works for both directions)
            lettersToUpdate.forEach(letter => {
                // Check if letter still exists
                if (!letter.element || !letter.element.parentNode) {
                    return;
                }
                
                // Calculate scroll distance from letter's spawn point
                const scrollDistance = scrollY - letter.startScrollY;
                
                // Apply parallax effect (positive for down, negative for up)
                const parallaxScrollDistance = scrollDistance * PARALLAX_FACTOR * letter.parallaxSpeed;
                
                // Calculate new position (works for both up and down scrolling)
                const newTop = letter.startY + (parallaxScrollDistance / 8);
                
                // Update the letter position
                letter.element.style.top = `${newTop}%`;
                
                // Add a slight horizontal movement
                const horizontalMovement = Math.sin(scrollY / 600 + letter.startX) * 2;
                letter.element.style.left = `${letter.startX + horizontalMovement}%`;
                
                // Add subtle rotation based on scroll direction
                let rotationDelta;
                if (isScrollingDown) {
                    rotationDelta = scrollDelta * 0.02;
                } else if (isScrollingUp) {
                    rotationDelta = scrollDelta * 0.02; // Same speed for up scroll
                } else {
                    rotationDelta = 0;
                }
                
                const newRotation = letter.rotation + rotationDelta;
                letter.element.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
                
                // Update letter direction
                letter.direction = isScrollingDown ? 1 : isScrollingUp ? -1 : 0;
                
                // Fade in/out logic (works for both directions)
                const letterTopPercent = newTop;
                let opacity = 0.9;
                
                // Fade in when entering viewport from top or bottom
                if (letterTopPercent < 20 || letterTopPercent > 80) {
                    const distanceFromEdge = letterTopPercent < 20 ? 
                        Math.abs(letterTopPercent - 20) : 
                        Math.abs(letterTopPercent - 80);
                    opacity = Math.max(0.2, (1 - distanceFromEdge / 20) * 0.9);
                }
                
                // Extra fade for very top and bottom
                if (letterTopPercent < -10 || letterTopPercent > 110) {
                    opacity = 0;
                    letter.isVisible = false;
                } else {
                    letter.isVisible = true;
                }
                
                letter.element.style.opacity = opacity;
                
                // Add subtle pulse effect when changing direction
                if (Math.abs(scrollDelta) > 10) {
                    letter.element.style.textShadow = 
                        `0 0 10px #ffffff, 
                         0 0 20px rgba(255, 255, 255, ${0.8 + Math.abs(scrollDelta) / 100})`;
                }
            });
            
            // Clean up letters that have gone completely off screen
            letters = letters.filter(letter => {
                if (!letter.element || !letter.element.parentNode) {
                    return false;
                }
                
                const top = parseFloat(letter.element.style.top);
                const opacity = parseFloat(letter.element.style.opacity);
                
                // Only remove if completely off screen and faded out
                if ((top < -20 || top > 120) && opacity < 0.05) {
                    if (letter.element && letter.element.parentNode) {
                        letterPositions.delete(letter.id);
                        letter.element.remove();
                    }
                    return false;
                }
                return true;
            });
            
            // Generate letters when in active zone
            const currentTime = Date.now();
            
            // Generate on both up and down scroll, but more on down
            if (Math.abs(scrollDelta) > 2 && letters.length < MAX_LETTERS) {
                if (currentTime - lastLetterGenerationTime > LETTER_GENERATION_INTERVAL) {
                    // Generate based on scroll speed and direction
                    const speedFactor = Math.min(3, Math.abs(scrollDelta) / 5);
                    
                    // Generate more when scrolling down, fewer when scrolling up
                    let numLetters;
                    if (isScrollingDown) {
                        numLetters = Math.floor(Math.random() * 3 * speedFactor) + 1;
                    } else if (isScrollingUp) {
                        // Generate some letters when scrolling up too
                        numLetters = Math.floor(Math.random() * 2 * speedFactor * 0.5) + 1;
                    } else {
                        numLetters = 0;
                    }
                    
                    // Create new letters
                    for (let i = 0; i < numLetters; i++) {
                        if (letters.length < MAX_LETTERS) {
                            createLetter(scrollY);
                        }
                    }
                    
                    lastLetterGenerationTime = currentTime;
                }
            }
            
            // When scrolling up, also check if we need to "recycle" letters
            if (isScrollingUp && letters.length > 0) {
                // Find letters that have gone off screen at the bottom
                const offScreenLetters = letters.filter(letter => {
                    const top = parseFloat(letter.element.style.top);
                    return top > 110;
                });
                
                // Move some of them back to the top
                offScreenLetters.slice(0, 3).forEach(letter => {
                    if (letter.element) {
                        // Reset to top with new properties
                        letter.startY = -15 - Math.random() * 25;
                        letter.startX = Math.random() * 90 + 5;
                        letter.startScrollY = scrollY;
                        letter.rotation = Math.random() * 30 - 15;
                        letter.spawnTime = Date.now();
                        
                        letter.element.style.top = `${letter.startY}%`;
                        letter.element.style.left = `${letter.startX}%`;
                        letter.element.style.opacity = '0.2';
                        letter.element.style.transition = 'none';
                        
                        // Force reflow
                        letter.element.offsetHeight;
                        
                        letter.element.style.transition = 'opacity 1s ease, top 0.3s ease';
                        setTimeout(() => {
                            if (letter.element) {
                                letter.element.style.opacity = '0.9';
                            }
                        }, 10);
                    }
                });
            }
        }
        
        lastScrollY = scrollY;
    }
    
    // Throttle scroll events
    let scrollTimeout;
    function handleScroll() {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                updateLetters();
                scrollTimeout = null;
            }, 16);
        }
    }
    
    // Initialize
    function init() {
        console.log('Initializing scrolling letters effect with upward scroll support');
        
        // Style the container
        lettersContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.8s ease;
            overflow: hidden;
        `;
        
        // Initial calculation
        triggerZones = calculateTriggerZones();
        
        // Set up scroll listener
        window.addEventListener('scroll', handleScroll);
        
        // Recalculate on resize
        window.addEventListener('resize', function() {
            triggerZones = calculateTriggerZones();
            updateLetters();
        });
        
        // Create debug visual indicator (optional)
        if (debugMode) {
            const indicator = document.createElement('div');
            indicator.id = 'zone-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: lime;
                padding: 8px 12px;
                font-size: 12px;
                font-family: monospace;
                z-index: 10000;
                border-radius: 3px;
                border: 1px solid lime;
                pointer-events: none;
            `;
            indicator.textContent = 'Waiting...';
            document.body.appendChild(indicator);
            
            // Update indicator on scroll
            window.addEventListener('scroll', function() {
                const scrollY = window.scrollY;
                const imageNum = Math.floor(scrollY / triggerZones.viewportHeight) + 1;
                const inZone = scrollY >= triggerZones.startY && scrollY <= triggerZones.endY;
                const direction = scrollY > lastScrollY ? '↓ DOWN' : scrollY < lastScrollY ? '↑ UP' : '—';
                
                indicator.innerHTML = `
                    Scroll: ${Math.round(scrollY)}px ${direction}<br>
                    Image ${imageNum} at top<br>
                    Zone: ${triggerZones.startY}-${triggerZones.endY}px<br>
                    Active: ${inZone ? 'YES' : 'NO'}<br>
                    Letters: ${letters.length}
                `;
                indicator.style.background = inZone ? 'rgba(0,100,0,0.8)' : 'rgba(0,0,0,0.8)';
            });
        }
        
        // Initial update
        updateLetters();
    }
    
    // Start the effect
    init();
});