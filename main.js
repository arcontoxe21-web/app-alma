import { getVetResponse, initVetSession } from './services/gemini.js';

/* --- AUTHENTICATION MODULE --- */
const Auth = {
    user: JSON.parse(localStorage.getItem('alma_user')) || null,

    register(name, email, password, animalType) {
        const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            password, // Mock: In production, hash this!
            animalType, // Spirit Animal (wolf, cat, etc.)
            avatar: this.getAnimalAvatar(animalType),
            level: 1,
            xp: 0,
            stats: {
                alerts: 0,
                sponsored: 0,
                events: 0
            },
            history: [
                { date: new Date().toLocaleDateString(), action: 'Te has unido a la Manada', icon: 'fa-paw' }
            ]
        };
        localStorage.setItem('alma_user', JSON.stringify(newUser));
        this.user = newUser;
        return newUser;
    },

    login(email, password) {
        const stored = JSON.parse(localStorage.getItem('alma_user'));
        if (stored && stored.email === email && stored.password === password) {
            this.user = stored;
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem('alma_user');
        this.user = null;
        window.location.reload();
    },

    getAnimalAvatar(type) {
        const avatars = {
            'wolf': 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200&auto=format&fit=crop', // Lobo
            'fox': 'https://images.unsplash.com/photo-1516934024742-b461fba47600?q=80&w=200&auto=format&fit=crop', // Zorro
            'eagle': 'https://images.unsplash.com/photo-1611000962228-444f5bd63ac9?q=80&w=200&auto=format&fit=crop', // Águila
            'cat': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop', // Gato
            'lion': 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?q=80&w=200&auto=format&fit=crop' // León
        };
        return avatars[type] || avatars['wolf'];
    },

    updateUI() {
        // EXCEPCIÓN: Si estamos en la Landing Page del navegador, no forzar login aún
        const isLandingActive = document.getElementById('screen-landing')?.classList.contains('active');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isLandingActive && !isStandalone && !this.user) {
            console.log("🛑 Auth: Landing PWA activa en navegador. Esperando instalación o login manual.");
            return;
        }

        if (this.user) {
            // Update Header Name
            const nameEl = document.querySelector('#screen-home h1');
            if (nameEl) nameEl.innerHTML = `Hola, ${this.user.name.split(' ')[0]} <span style="font-size: 20px;">👋</span>`;

            // Update Avatars
            document.querySelectorAll('.user-avatar img').forEach(img => {
                img.src = this.user.avatar;
            });

            // Show App, Hide Login
            document.getElementById('screen-login')?.classList.remove('active');
            document.getElementById('screen-register')?.classList.remove('active');
            document.getElementById('screen-landing')?.classList.remove('active');

            // If on login screen, go home
            if (!document.querySelector('.screen.active') || document.querySelector('.screen.active').id.includes('login') || document.querySelector('.screen.active').id.includes('register') || document.querySelector('.screen.active').id.includes('landing')) {
                document.getElementById('screen-home').classList.add('active');
                document.querySelector('.bottom-nav').classList.remove('hidden');
            }
        } else {
            // Show Login
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('screen-login')?.classList.add('active');
            document.querySelector('.bottom-nav').classList.add('hidden');
        }
    }
};

window.Auth = Auth;

const animals = [
    // --- DOGS (RESCUED FROM ALMA HONDON) ---
    {
        id: 'bimbo-real',
        type: 'dog',
        name: 'BIMBO',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_2f147a67375c4e41af34cd019a0c0144~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Un compañero leal esperando su oportunidad. Bimbo tiene un corazón enorme.',
        attributes: ['Leal', 'Cariñoso', 'Sociable'],
        stats: { energy: 60, social: 90, training: 70 }
    },
    {
        id: 'scruffy-real',
        type: 'dog',
        name: 'SCRUFFY',
        breed: 'Terrier Mix',
        age: 'Senior',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_c790cfa8fb254643925824ff68747cba~mv2.png/v1/fill/w_281,h_322,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.png',
        story: 'Scruffy es un alma vieja con mucho amor para dar. Busca un retiro tranquilo.',
        attributes: ['Tranquilo', 'Dulce', 'Senior'],
        stats: { energy: 30, social: 100, training: 80 }
    },
    {
        id: 'fiona-real',
        type: 'dog',
        name: 'FIONA',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_be0fada156ca4a73adf0886b5108ea7f~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Fiona es pura dulzura. Le encanta la compañía humana y los paseos largos.',
        attributes: ['Dulce', 'Activa', 'Cariñosa'],
        stats: { energy: 70, social: 95, training: 75 }
    },
    {
        id: 'baldo-real',
        type: 'dog',
        name: 'BALDO',
        breed: 'Podenco',
        age: 'Joven',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_26b20742c7044f7ea607557692c36d3f~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Baldo es elegante y veloz. Un espíritu libre que busca una familia activa.',
        attributes: ['Elegante', 'Rápido', 'Juguetón'],
        stats: { energy: 90, social: 85, training: 60 }
    },
    {
        id: 'spike-real',
        type: 'dog',
        name: 'SPIKE',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_cabb347f3a1c4dbf84e287f565f09441~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Spike es todo carácter y diversión. Nunca te aburrirás con él a tu lado.',
        attributes: ['Divertido', 'Carácter', 'Leal'],
        stats: { energy: 80, social: 70, training: 70 }
    },
    {
        id: 'zorro-henry-real',
        type: 'dog',
        name: 'ZORRO (HENRY)',
        breed: 'Pastor Mix',
        age: 'Joven',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_dded5f5cb01741c3b613af92ef036847~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Inteligente como un zorro y noble como un caballero. Henry espera aventuras.',
        attributes: ['Inteligente', 'Noble', 'Aventurero'],
        stats: { energy: 85, social: 80, training: 90 }
    },
    {
        id: 'koba-real',
        type: 'dog',
        name: 'KOBA',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_b889875ffe57491589ec4ec95711dd3a~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Koba tiene una mirada que hipnotiza. Tranquilo pero siempre atento.',
        attributes: ['Atento', 'Tranquilo', 'Fiel'],
        stats: { energy: 50, social: 80, training: 75 }
    },
    {
        id: 'willow-real',
        type: 'dog',
        name: 'WILLOW',
        breed: 'Galgo Mix',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_bd4e486a8b2c40948d3a3616ce9c6465~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Willow es delicada y veloz. Necesita espacio para correr y un sofá para descansar.',
        attributes: ['Delicada', 'Veloz', 'Cariñosa'],
        stats: { energy: 85, social: 90, training: 65 }
    },
    {
        id: 'coppa-real',
        type: 'dog',
        name: 'COPPA',
        breed: 'Podenco Mix',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_ec7d3033a5ce4151b20a255ef02a49ec~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Coppa es pura alegría. Su cola no para de moverse cuando ve a alguien.',
        attributes: ['Alegre', 'Activa', 'Amistosa'],
        stats: { energy: 90, social: 100, training: 70 }
    },
    {
        id: 'tango-real',
        type: 'dog',
        name: 'TANGO',
        breed: 'Breton',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_3a9096bd69c047678f835ba2374d068b~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Le pone ritmo a la vida. Tango es un compañero de baile perfecto para la vida.',
        attributes: ['Rítmico', 'Obediente', 'Cazador de mimos'],
        stats: { energy: 80, social: 85, training: 85 }
    },
    {
        id: 'guapa-real',
        type: 'dog',
        name: 'GUAPA',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_bb4f2a4e99ee46a4b43410c6170248c2~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Su nombre lo dice todo. Guapa por fuera y por dentro.',
        attributes: ['Bella', 'Tranquila', 'Amorosa'],
        stats: { energy: 50, social: 95, training: 80 }
    },
    {
        id: 'luna-dog-real',
        type: 'dog',
        name: 'LUNA (PERRO)',
        breed: 'Mestizo',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_37499bb575f44187a7b78e5baa0082be~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Luna ilumina los días nublados. Siempre lista para jugar.',
        attributes: ['Luminosa', 'Juguetona', 'Lista'],
        stats: { energy: 75, social: 90, training: 70 }
    },
    {
        id: 'leo-dog-real',
        type: 'dog',
        name: 'LEO',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_19b86031245f445b8147edc7578f3010~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Un rey sin corona buscando su castillo. Leo es majestuoso y noble.',
        attributes: ['Majestuoso', 'Noble', 'Líder'],
        stats: { energy: 70, social: 80, training: 85 }
    },
    {
        id: 'cazz-real',
        type: 'dog',
        name: 'CAZZ',
        breed: 'Mestizo',
        age: 'Joven',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_e166e6e0964f45e698b977b51895b288~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Cazz es un torbellino de diversión. Ideal para familias activas.',
        attributes: ['Divertido', 'Activo', 'Simpático'],
        stats: { energy: 90, social: 95, training: 60 }
    },
    {
        id: 'odie-real',
        type: 'dog',
        name: 'ODIE',
        breed: 'Mestizo',
        age: 'Cachorro',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_bb76f1e9d97d44e79d03ccfa53bca377~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'El pequeño Odie está descubriendo el mundo. ¿Quieres enseñárselo?',
        attributes: ['Cachorro', 'Curioso', 'Adorable'],
        stats: { energy: 80, social: 100, training: 40 }
    },
    {
        id: 'turner-real',
        type: 'dog',
        name: 'TURNER',
        breed: 'Mestizo',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_c2e2643c9bba413aa7a75fba281182df~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Turner es un superviviente. Fuerte, resiliente y muy agradecido.',
        attributes: ['Fuerte', 'Agradecido', 'Resiliente'],
        stats: { energy: 70, social: 80, training: 80 }
    },
    {
        id: 'tyson-real',
        type: 'dog',
        name: 'TYSON',
        breed: 'Bull Mix',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_1704e4f955d84ef5a344d439129802e0~mv2.jpg/v1/fill/w_281,h_322,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image-place-holder.jpg',
        story: 'Un grandullón con corazón de peluche. Tyson impone respeto pero regala amor.',
        attributes: ['Fuerte', 'Protector', 'Cariñoso'],
        stats: { energy: 65, social: 85, training: 75 }
    },

    // --- CATS (RESCUED FROM ALMA HONDON) ---
    {
        id: 'mokey-real',
        type: 'cat',
        name: 'MOKEY',
        breed: 'Común Europeo',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_29cd6c087ed341759a50f349e635cea4~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Mokey es la reina de la elegancia. Observadora y serena.',
        attributes: ['Elegante', 'Serena', 'Observadora'],
        stats: { energy: 40, social: 70, training: 60 }
    },
    {
        id: 'nebula-real',
        type: 'cat',
        name: 'NEBULA',
        breed: 'Gato Negro',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_d5b4f0d0175e45508578952ae8915027~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Como una galaxia lejana, Nebula es misteriosa y fascinante.',
        attributes: ['Misteriosa', 'Tranquila', 'Negra'],
        stats: { energy: 50, social: 60, training: 50 }
    },
    {
        id: 'smoky-real',
        type: 'cat',
        name: 'SMOKY',
        breed: 'Gris',
        age: 'Adulto',
        gender: 'Macho',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_6c39c77cece643c3970e50e8070a0c93~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'El humo se disipa, pero el amor de Smoky permanece. Un gato gris precioso.',
        attributes: ['Gris', 'Cimoso', 'Tranquilo'],
        stats: { energy: 40, social: 90, training: 60 }
    },
    {
        id: 'martha-real',
        type: 'cat',
        name: 'MARTHA',
        breed: 'Carey',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_742a9fd281484c61811aa01af85d6c8f~mv2.png/v1/fill/w_292,h_379,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.png',
        story: 'Martha tiene mil colores en su pelaje y mil ronroneos para ti.',
        attributes: ['Colorida', 'Ronroneadora', 'Dulce'],
        stats: { energy: 50, social: 95, training: 50 }
    },
    {
        id: 'molly-real',
        type: 'cat',
        name: 'MOLLY',
        breed: 'Tabby',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_d0bd592b673c4f6d9dc0ff4178fa1eae~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Molly es curiosa y vivaz. Siempre buscando un nuevo rincón para explorar.',
        attributes: ['Curiosa', 'Vivaz', 'Juguetona'],
        stats: { energy: 70, social: 80, training: 65 }
    },
    {
        id: 'carla-real',
        type: 'cat',
        name: 'CARLA',
        breed: 'Común Europeo',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_b4faa63159b34bdcb0778ff5188515c0~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Carla es una dama. Educada, limpia y muy compañera.',
        attributes: ['Dama', 'Educada', 'Compañera'],
        stats: { energy: 40, social: 85, training: 80 }
    },
    {
        id: 'alexxia-real',
        type: 'cat',
        name: 'ALEXXIA',
        breed: 'Blanco y Negro',
        age: 'Joven',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/575320_8b9478b1b1cb441ebcd47652c2d75f68~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Alexxia viste de etiqueta siempre. Un smoking perfecto y una personalidad a juego.',
        attributes: ['Elegante', 'Bicolor', 'Simpática'],
        stats: { energy: 60, social: 80, training: 60 }
    },
    {
        id: 'paty-real',
        type: 'cat',
        name: 'PATY',
        breed: 'Tabby',
        age: 'Adulto',
        gender: 'Hembra',
        status: 'Disponible',
        imageUrl: 'https://static.wixstatic.com/media/efbe9f_8183e6e948f5473bb97704dc34e627ce~mv2.jpg/v1/fill/w_292,h_379,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/shutterstock_1898354080.jpg',
        story: 'Paty es la dulzura personificada. Un abrazo hecho gato.',
        attributes: ['Dulce', 'Cariñosa', 'Tranquila'],
        stats: { energy: 45, social: 100, training: 70 }
    }
];

/* --- CATALOG FILTERS --- */
window.filterCatalog = (filter, btn) => {
    // 1. Update Buttons
    if (btn) {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // 2. Filter Logic
    const container = document.getElementById('full-catalog-list');
    if (!container) return;

    container.innerHTML = '';

    let filtered = animals;
    if (filter === 'dog') {
        filtered = animals.filter(a => a.type === 'dog');
    } else if (filter === 'cat') {
        filtered = animals.filter(a => a.type === 'cat');
    } else if (filter === 'urgent') {
        filtered = animals.filter(a => a.status === 'Prioridad' || a.status === 'Urgente');
    }

    // 3. Render
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-paw" style="font-size:30px; margin-bottom:15px; opacity:0.3;"></i>
                <p>No hay animales en esta categoría por ahora.</p>
            </div>
        `;
    } else {
        filtered.forEach(a => container.appendChild(createAnimalCard(a)));
    }
};

const posts = [
    { id: 1, author: 'Marta Soler', text: 'MAXIMUS hoy nos ha dado una lección de coraje.', img: animals[0].imageUrl, likes: 45, time: '1h' },
    { id: 2, author: 'Refugio Alma', text: 'Nuevas llegadas al santuario.', img: animals[1].imageUrl, likes: 89, time: '3h' }
];

/* --- UI TOOLKIT --- */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span style="font-size: 14px; font-weight: 600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/* --- ROUTER ENGINE --- */
const Router = {
    activeScreen: 'home',
    init() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.getAttribute('data-screen'));
            });
        });
    },
    navigate(screenId) {
        this.activeScreen = screenId;

        // Controlar visibilidad de Nav Bar
        const nav = document.querySelector('.bottom-nav');
        if (screenId === 'detail' || screenId === 'chat') {
            nav.classList.add('hidden');
        } else {
            nav.classList.remove('hidden');
        }

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.add('active');

        const navLink = document.querySelector(`[data-screen="${screenId}"]`);
        if (navLink) navLink.classList.add('active');

        const viewPort = document.getElementById(`screen-${screenId}`);
        if (viewPort) viewPort.scrollTop = 0;

        // Force Social Hub Init
        if (screenId === 'community') {
            console.log("📍 Entering Social Hub (Community ID)...");
            if (window.switchSocialTab) {
                window.switchSocialTab('heroes');
            }
        }
    }
};

// Hacer Router accesible globalmente para los onclick de HTML dinámico
window.Router = Router;

/* --- RENDERERS --- */
function createAnimalCard(animal) {
    const div = document.createElement('div');
    div.className = 'animal-card-dark';
    div.innerHTML = `
    <div class="card-img-container">
      <img src="${animal.imageUrl}" loading="lazy">
      <div style="position: absolute; top: 16px; left: 16px;">
        <span class="badge-elite">${animal.status}</span>
      </div>
    </div>
    <div class="card-info-dark">
      <h3 style="font-size: 22px; font-weight: 800; margin-bottom: 4px;">${animal.name}</h3>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 15px;">${animal.breed} • ${animal.age}</p>
      <div style="display: flex; gap: 8px;">
        ${animal.attributes.map(a => `<span class="pill-tag">${a}</span>`).join('')}
      </div>
    </div>
  `;
    div.onclick = () => showDetail(animal);
    return div;
}

function showDetail(animal) {
    const screen = document.getElementById('screen-detail');
    screen.innerHTML = `
    <div style="position: relative; height: 50vh;">
      <img src="${animal.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6);">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(transparent, var(--bg-dark));"></div>
      <button id="close-detail" style="position: absolute; top: 40px; left: 24px; width: 50px; height: 50px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); color: white; cursor: pointer;">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
    </div>
    <div style="padding: 0 30px 150px; margin-top: -60px; position: relative; z-index: 100;">
        <h1 style="font-size: 48px; font-weight: 900; margin-bottom: 30px; font-family: var(--font-display);">${animal.name}</h1>
        
        <div style="display: flex; gap: 12px; margin-bottom: 35px;">
            <div style="flex: 1; background: var(--bg-surface); padding: 22px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase;">EDAD</p>
                <p style="font-weight: 800; font-size: 18px; margin-top: 5px;">${animal.age}</p>
            </div>
            <div style="flex: 1; background: var(--bg-surface); padding: 22px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);">
                <p style="color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase;">GENERO</p>
                <p style="font-weight: 800; font-size: 18px; margin-top: 5px;">${animal.gender}</p>
            </div>
        </div>

        <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 12px; color: var(--primary);">NUESTRA HISTORIA</h3>
        <p style="line-height: 1.8; color: var(--text-muted); font-size: 16px; margin-bottom: 40px;">${animal.story}</p>
        
        <div style="background: var(--bg-surface); padding: 30px; border-radius: 30px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.02);">
            <h3 style="font-size: 14px; font-weight: 900; margin-bottom: 25px; letter-spacing: 2px; color: var(--accent);">ESTADÍSTICAS ELITE</h3>
            ${Object.entries(animal.stats).map(([k, v]) => `
                <div style="margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; font-weight: 700; color: var(--text-muted);">
                        <span style="text-transform: uppercase;">${k}</span>
                        <span>${v}%</span>
                    </div>
                    <div style="height: 5px; background: rgba(255,255,255,0.03); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${v}%; height: 100%; background: linear-gradient(to right, var(--primary), #00d2ff);"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <button class="btn-noir" style="height: 70px;">CONECTAR CON ${animal.name}</button>
    </div>
  `;
    Router.navigate('detail');
    document.getElementById('close-detail').onclick = () => Router.navigate('catalog');
}

/* --- RESCUE & RADAR LOGIC --- */
const LocationManager = {
    pos: JSON.parse(localStorage.getItem('alma_last_pos')) || null,
    watchId: null,
    status: 'idle', // idle, locating, success, error
    error: null,
    manuallyMoved: false,

    async init() {
        console.log("📍 LocationManager: Iniciando...");
        this.status = 'locating';

        // Comprobar si la API existe (falla en móviles con HTTP móvil)
        if (!navigator.geolocation) {
            console.warn("⚠️ API de Geolocalización no disponible (¿No es HTTPS?)");
            this.handleError({ code: 0, message: "Requiere HTTPS en móvil" });
            this.locateByIP(); // Forzar IP inmediatamente
            return;
        }

        // 1. Intentar IP como fallback ultra-rápido si en 3 segundos no hay GPS
        setTimeout(() => {
            if (!this.pos) {
                console.log("📍 GPS lento, intentando fallback por IP...");
                this.locateByIP();
            }
        }, 3000);

        // 2. Intentar obtener posición rápida inicial para disparar el prompt
        navigator.geolocation.getCurrentPosition(
            (p) => {
                console.log("📍 Posición rápida inicial obtenida");
                this.updateInternal(p, 'initial-fast');
            },
            (err) => {
                console.warn("⚠️ Fallo posición rápida inicial:", err.message);
            },
            { enableHighAccuracy: false, maximumAge: 30000, timeout: 5000 }
        );

        // 3. Iniciar seguimiento de alta precisión
        this.startWatch();
    },

    async locateByIP() {
        try {
            // Usamos una API gratuita y rápida para obtener ubicación aproximada
            const resp = await fetch('https://ipapi.co/json/');
            const data = await resp.json();
            if (data.latitude && data.longitude && !this.pos) {
                console.log("📍 Ubicación aproximada por IP obtenida");
                const ipPos = [data.latitude, data.longitude];
                this.pos = ipPos;
                this.status = 'success';
                this.syncUI();
            }
        } catch (e) {
            console.warn("⚠️ Fallo fallback IP:", e);
        }
    },

    startWatch() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);

        // Configuraciones de watch: timeouts largos para dar tiempo a los satélites en Mac/Chrome
        this.watchId = navigator.geolocation.watchPosition(
            (p) => this.updateInternal(p, 'watch'),
            (err) => {
                if (this.status === 'locating' && err.code !== 1) {
                    console.log("🔄 Reintentando watch con baja precisión...");
                    this.startWatchLow();
                }
                this.handleError(err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    },

    startWatchLow() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        this.watchId = navigator.geolocation.watchPosition(
            (p) => this.updateInternal(p, 'low-accuracy'),
            (err) => this.handleError(err),
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
        );
    },

    updateInternal(p, source) {
        const newPos = [p.coords.latitude, p.coords.longitude];
        this.pos = newPos;
        this.status = 'success';
        this.error = null;
        localStorage.setItem('alma_last_pos', JSON.stringify(newPos));

        console.log(`📍 Posición actualizada (${source}):`, newPos);

        // Quitar overlays de carga
        document.querySelectorAll('.map-loading-overlay').forEach(el => el.remove());

        // Actualizar UI y Mapas
        this.syncUI();
    },

    handleError(err) {
        console.warn("⚠️ GPS Error:", err.message);
        this.status = 'error';
        this.error = err;

        const display = document.getElementById('location-display');
        if (display) {
            let msg = "Buscando señal...";
            if (err.code === 1) msg = "Permiso denegado en sistema";
            else if (err.code === 2) msg = "Señal Wi-Fi/GPS no disponible";
            else if (err.code === 3) msg = "Tiempo agotado";

            if (this.pos) {
                // Si tenemos IP pero el GPS falló, avisamos con un toast discreto
                showToast(`GPS preciso no disponible: ${msg}. Usando ubicación aproximada.`, "info");
            } else {
                display.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> GPS: ${msg}`;
            }
        }

        // Si es un error de permiso o señal de Mac (WiFi off), dejamos de bloquear al usuario
        if (err.code === 1 || err.code === 2) {
            document.querySelectorAll('.map-loading-overlay').forEach(el => el.remove());
        }
    },

    syncUI() {
        // Actualizar display de texto
        if (this.pos) {
            const display = document.getElementById('location-display');
            if (display) {
                display.innerHTML = `<i class="fa-solid fa-location-dot" style="color: var(--primary); margin-right: 8px;"></i> ${this.pos[0].toFixed(5)}, ${this.pos[1].toFixed(5)}`;
            }
        }

        // Sincronizar Mapa de Reporte
        if (rescueMap && rescueMarker && !this.manuallyMoved) {
            rescueMap.flyTo(this.pos, 16);
            rescueMarker.setLatLng(this.pos);
        }

        // Sincronizar Radar Social
        if (radarMap) {
            if (!radarMap._hasCentered && this.pos) {
                radarMap.flyTo(this.pos, 13);
                radarMap._hasCentered = true;
            }
            activeAlerts.forEach(a => {
                if (this.pos) {
                    a.distance = (L.latLng(this.pos).distanceTo(L.latLng(a.loc)) / 1000).toFixed(1);
                }
            });
            renderAlertList();
        }
    },

    async forceLocate() {
        this.manuallyMoved = false;
        this.status = 'locating';
        this.syncUI();

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (p) => {
                    this.updateInternal(p, 'manual');
                    resolve(p);
                },
                (err) => {
                    this.handleError(err);
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
};

let rescueMap, rescueMarker, radarMap;

const activeAlerts = [
    { id: 'al-1', type: 'Gato', status: 'En espera', loc: [40.4233, -3.6912], address: 'Calle de Hortaleza, 48, Madrid', title: 'Gato atrapado en cornisa', user: 'Ana M.', messages: ['ALERTA DE CAMPO', 'Se encuentra en el tercer piso, parece asustado.', '¿Alguien tiene una escalera?', 'Estoy cerca, llego en 5 min.'] },
    { id: 'al-2', type: 'Perro', status: 'Coordinando', loc: [40.4100, -3.7150], address: 'C. de Toledo, 72, Madrid', title: 'Perro herido en parque', user: 'Marcos T.', messages: ['ALERTA DE CAMPO', 'Cojea de la pata trasera derecha, está muy tranquilo.', 'Ya hemos llamado al veterinario.', 'Necesitamos transporte.'] }
];

/* --- GPS UTILS --- */

function initRescueTabs() {
    document.querySelectorAll('.rescue-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const id = tab.getAttribute('data-tab');
            document.querySelectorAll('.rescue-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`tab-${id}`).style.display = 'block';

            if (id === 'radar') setTimeout(initRadarMap, 150);
            if (id === 'report') setTimeout(initRescueMap, 150);
        });
    });
}

function initRescueMap() {
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) no está cargado.");
        showToast("Error: No se pudo cargar el motor de mapas.", "error");
        return;
    }

    const mapContainer = document.getElementById('rescue-map');
    if (!mapContainer) return;

    if (rescueMap) {
        console.log("Re-ajustando mapa existente...");
        setTimeout(() => {
            rescueMap.invalidateSize();
            if (rescueMarker) rescueMap.setView(rescueMarker.getLatLng());
        }, 100);
        return;
    }

    console.log("Iniciando nuevo mapa de rescate...");

    // Si tenemos ubicación en caché, empezamos ahí directamente
    const startPos = LocationManager.pos || [40.4168, -3.7038];
    rescueMap = L.map('rescue-map', { zoomControl: false, attributionControl: false }).setView(startPos, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(rescueMap);

    rescueMarker = L.marker(startPos, { draggable: true }).addTo(rescueMap);
    rescueMarker.on('dragstart', () => {
        LocationManager.manuallyMoved = true;
    });
    rescueMarker.on('dragend', () => {
        const pos = rescueMarker.getLatLng();
        LocationManager.pos = [pos.lat, pos.lng];
        LocationManager.syncUI();
    });

    // Si no tenemos ubicación reciente, mostramos un overlay de carga sobre el mapa
    if (LocationManager.status === 'locating') {
        const overlay = document.createElement('div');
        overlay.className = 'map-loading-overlay';
        overlay.style = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:2000; border-radius:24px; color:white; font-size:14px; font-weight:700;';
        overlay.innerHTML = `
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size:30px; color:var(--primary); margin-bottom:15px;"></i>
            <span>OBTENIENDO TU POSICIÓN...</span>
            <p style="font-size:10px; color:var(--text-muted); margin-top:10px;">Asegúrate de estar cerca de una ventana o WiFi</p>
            <button onclick="document.querySelectorAll('.map-loading-overlay').forEach(el=>el.remove()); LocationManager.manuallyMoved=true;" style="margin-top:20px; background:none; border:1px solid rgba(255,255,255,0.2); color:white; padding:8px 15px; border-radius:10px; font-size:11px;">USAR MAPA MANUAL</button>
        `;
        mapContainer.appendChild(overlay);
    }

    LocationManager.syncUI();
}

function initRadarMap() {
    const startPos = LocationManager.pos || [40.4168, -3.7038];

    if (radarMap) {
        // Limpiar marcadores anteriores para regenerarlos si hay nuevos SOS
        radarMap.eachLayer((layer) => {
            if (layer instanceof L.Marker) radarMap.removeLayer(layer);
        });
        if (LocationManager.pos) {
            radarMap.setView(LocationManager.pos, 13);
            radarMap._hasCentered = true;
        }
    } else {
        radarMap = L.map('radar-map', { zoomControl: false, attributionControl: false }).setView(startPos, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(radarMap);
        if (LocationManager.pos) radarMap._hasCentered = true;
    }


    // Añadir marcadores
    activeAlerts.forEach(alert => {
        const marker = L.marker(alert.loc).addTo(radarMap);
        // Usar un listener robusto
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            window.enterRescueChat(alert.id);
        });
        marker.bindTooltip(alert.title, { direction: 'top', offset: [0, -10] });
    });

    // Distancias iniciales si hay caché
    if (LocationManager.pos) {
        activeAlerts.forEach(a => {
            a.distance = (L.latLng(LocationManager.pos).distanceTo(L.latLng(a.loc)) / 1000).toFixed(1);
        });
    }

    renderAlertList();
}

function renderAlertList() {
    const list = document.getElementById('radar-alerts-list');
    if (!list) return;
    list.innerHTML = activeAlerts.map(a => `
        <div class="glass-card" style="display: flex; gap: 15px; align-items: center; padding: 18px; margin-bottom: 12px; border: 1px solid rgba(16,251,186,0.1); cursor:pointer;" onclick="window.enterRescueChat('${a.id}')">
            <div class="pulse-marker" style="width: 12px; height: 12px; background: ${a.type === 'Gato' ? 'var(--primary)' : 'var(--danger)'}; border-radius: 50%;"></div>
            <div style="flex: 1;">
                <h5 style="font-size: 15px; font-weight: 800;">${a.title}</h5>
                <p style="font-size: 12px; color: var(--text-muted);">${a.type} • ${a.status} ${a.distance ? `• a ${a.distance} km` : ''}</p>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--text-dim); font-size: 12px;"></i>
        </div>
    `).join('');
}

window.enterRescueChat = (alertId) => {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) {
        console.error("Alert not found:", alertId);
        return;
    }

    const screen = document.getElementById('screen-chat');
    // Reiniciar scroll y contenido
    screen.scrollTop = 0;

    screen.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; background: #000;">
            <!-- Header Operativo Reforzado -->
            <header style="padding: 55px 25px 25px; background: rgba(21, 21, 21, 0.98); backdrop-filter: blur(30px); border-bottom: 1px solid rgba(16,251,186,0.15); display: flex; align-items: center; gap: 20px; position: sticky; top: 0; z-index: 1000;">
                <button onclick="Router.navigate('rescue')" style="background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.1); color: white; width: 50px; height: 50px; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'">
                    <i class="fa-solid fa-chevron-left" style="font-size: 20px;"></i>
                </button>
                <div style="flex: 1; overflow: hidden;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="badge-elite" style="background: var(--primary); color: #000; font-size: 9px; padding: 4px 10px; font-weight: 900; border-radius: 100px;">${alert.type.toUpperCase()}</span>
                        <span style="color: var(--text-dim); font-size: 10px; font-weight: 800; letter-spacing: 1px;">ID: ${alert.id}</span>
                    </div>
                    <h3 style="font-size: 18px; font-weight: 900; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alert.title}</h3>
                    <p style="font-size: 12px; color: var(--text-muted); font-weight: 600; margin-top: 2px;"><i class="fa-solid fa-location-dot" style="color: var(--primary); margin-right: 5px;"></i>${alert.address || 'Ubicación aproximada'}</p>
                </div>
            </header>

            <div id="chat-content-scroller" style="flex: 1; overflow-y: auto;">
                <!-- SECCIÓN INFO: EL EXPEDIENTE -->
                <div style="padding: 25px;">
                    <div id="mini-map-${alert.id}" style="height: 180px; border-radius: 24px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.5);"></div>
                    
                    <div class="glass-card" style="padding: 24px; border: 1px solid rgba(16,251,186,0.1); background: rgba(16,251,186,0.02); margin-bottom: 0;">
                        <h4 style="font-size: 11px; color: var(--primary); font-weight: 900; letter-spacing: 2px; margin-bottom: 15px;">INFORME DE CAMPO</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-muted); font-size: 13px;">Reportante:</span>
                                <span style="color: white; font-weight: 700; font-size: 13px;">${alert.user}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: var(--text-muted); font-size: 13px;">Estado:</span>
                                <span style="color: var(--primary); font-weight: 800; font-size: 13px;">${alert.status.toUpperCase()}</span>
                            </div>
                            <div style="padding: 15px; background: rgba(0,0,0,0.3); border-radius: 12px; font-size: 14px; color: white; border-left: 3px solid var(--primary); line-height: 1.5;">
                                "${alert.messages[1] || 'Sin diagnóstico detallado'}"
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN COMUNICACIÓN: CHAT -->
                <div id="chat-messages" style="padding: 0 25px 50px; display: flex; flex-direction: column; gap: 15px;">
                    <div style="text-align: center; margin: 10px 0;">
                        <span style="font-size: 10px; color: var(--text-dim); font-weight: 800; background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: 20px;">INTERCOMUNICADOR SEGURO ACTIVADO</span>
                    </div>
                    ${alert.messages.slice(2).map(m => `<div class="chat-bubble other">${m}</div>`).join('')}
                </div>
            </div>

            <!-- Entrada de Mensajes Flotante -->
            <div class="chat-input-container" style="background: rgba(10,10,10,0.98); backdrop-filter: blur(30px); padding: 20px 25px 45px; border-top: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; gap: 12px;">
                    <input type="text" id="msg-input" placeholder="Enviar informe al equipo..." style="flex: 1; background: var(--bg-surface); border: 1px solid rgba(16,251,186,0.1); padding: 18px 20px; border-radius: 20px; color: white; font-family: var(--font-body); font-size: 14px;">
                    <button onclick="window.sendMessage('${alert.id}')" style="width: 58px; height: 58px; border-radius: 20px; background: var(--primary); border: none; color: #000; display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-neon);">
                        <i class="fa-solid fa-paper-plane" style="font-size: 20px;"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Cambiar de pantalla
    Router.navigate('chat');

    // Renderizar mini mapa con delay para asegurar que el DOM existe
    setTimeout(() => {
        const miniContainer = document.getElementById(`mini-map-${alert.id}`);
        if (!miniContainer) return;

        const miniMap = L.map(`mini-map-${alert.id}`, { zoomControl: false, attributionControl: false, dragging: true }).setView(alert.loc, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
        L.marker(alert.loc).addTo(miniMap);

        // Scroll automático al final
        const scroller = document.getElementById('chat-content-scroller');
        scroller.scrollTop = scroller.scrollHeight;
    }, 450);
};

window.sendMessage = (alertId) => {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    const alert = activeAlerts.find(a => a.id === alertId);
    alert.messages.push(text);

    const chatMessages = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.innerText = text;
    chatMessages.appendChild(bubble);

    input.value = '';
    const scroller = document.getElementById('chat-content-scroller');
    scroller.scrollTop = scroller.scrollHeight;

    // Simular respuesta rápida
    setTimeout(() => {
        const replyText = "Entendido, estoy monitorizando la zona. ¿Necesitáis algo más?";
        const reply = document.createElement('div');
        reply.className = 'chat-bubble other';
        reply.innerText = replyText;
        chatMessages.appendChild(reply);
        scroller.scrollTop = scroller.scrollHeight;
        alert.messages.push(replyText);
    }, 1500);
};

function updateLocationDisplay(lat, lng) {
    const display = document.getElementById('location-display');
    if (display) display.innerHTML = `<i class="fa-solid fa-location-dot" style="color: var(--primary); margin-right: 8px;"></i> ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function searchAddress() {
    const input = document.getElementById('search-address-input');
    const query = input.value.trim();
    if (!query) return;

    const btn = document.getElementById('btn-search-address');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const pos = [parseFloat(result.lat), parseFloat(result.lon)];

            rescueMap.flyTo(pos, 16);
            rescueMarker.setLatLng(pos);
            LocationManager.pos = pos;
            LocationManager.syncUI();
            showToast("Ubicación encontrada", "success");
            input.value = '';
        } else {
            showToast("No se encontró la dirección.", "info");
        }
    } catch (error) {
        console.error("Error en búsqueda:", error);
        showToast("Error al conectar con el servidor de mapas.", "error");
    } finally {
        btn.innerHTML = originalContent;
    }
}

window.searchAddress = searchAddress;

function handleLocateMe() {
    const btn = document.getElementById('btn-locate-me');
    if (!btn) return;

    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;

    LocationManager.forceLocate()
        .then(() => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            // Simulate GPS
            LocationManager.forceLocate()
                .then(() => {
                    btn.innerHTML = originalIcon;
                    btn.disabled = false;
                    showToast("Ubicación actualizada", "success");
                })
                .catch(err => {
                    console.error("Fallo manual GPS:", err);
                    let msg = "No se pudo obtener señal.";
                    let detail = "Mueve el pin o usa el buscador.";

                    if (err.code === 1) {
                        msg = "Permiso denegado.";
                        detail = "Actívalo en el icono del candado de tu navegador.";
                    } else if (err.code === 2) {
                        msg = "Señal no disponible.";
                        detail = "Revisa el WiFi de tu Mac o usa el buscador.";
                    } else if (err.code === 3) {
                        msg = "Tiempo agotado.";
                        detail = "Prueba de nuevo cerca de una ventana.";
                    }

                    showToast(`${msg} ${detail}`, "error");
                    btn.innerHTML = originalIcon;
                    btn.disabled = false;
                });
        });

}

/* --- PHOTO EVIDENCE LOGIC --- */
window.handlePhotoSelect = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById('preview-img').src = e.target.result;
            document.getElementById('rescue-photo-preview').style.display = 'block';
        }

        reader.readAsDataURL(file);
    }
}

window.clearPhoto = () => {
    document.getElementById('rescue-photo').value = '';
    document.getElementById('rescue-photo-preview').style.display = 'none';
    document.getElementById('preview-img').src = '';
}


function handleRescueSubmit() {
    console.log("Evento 'Enviar Alerta' capturado.");
    const type = document.getElementById('rescue-type').value;
    const condition = document.getElementById('rescue-condition').value.trim();
    const photoInput = document.getElementById('rescue-photo');
    const hasPhoto = photoInput.files && photoInput.files[0];

    if (!rescueMarker) {
        showToast("El mapa no se ha cargado correctamente.", "error");
        return;
    }

    const pos = rescueMarker.getLatLng();

    if (!condition) {
        showToast("Describe el estado del animal para que los voluntarios puedan ayudar.", "info");
        document.getElementById('rescue-condition').focus();
        return;
    }

    const btn = document.getElementById('btn-submit-rescue');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> DESPLEGANDO SOS...';
    btn.disabled = true;

    setTimeout(() => {
        const newAlert = {
            id: `SOS-${Date.now().toString().slice(-4)}`,
            type: type.charAt(0).toUpperCase() + type.slice(1),
            status: 'URGENTE SOS',
            loc: [pos.lat, pos.lng],
            address: `Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)}`, // Simulation
            title: `SOS: ${type.toUpperCase()} EN PELIGRO`,
            user: 'Tú (Hace un momento)',
            messages: ['ALERTA SOS', condition],
            hasPhoto: hasPhoto, // Flag for UI logic later if needed
            // If we had a backend, we would upload the photo here.
            distance: '0.0'
        };
        activeAlerts.unshift(newAlert);

        btn.innerHTML = '<i class="fa-solid fa-check"></i> ALERTA ENVIADA';
        btn.style.background = 'var(--primary)';
        btn.style.color = '#000';

        setTimeout(() => {
            showToast("¡Alerta SOS publicada con éxito!", "success");
            btn.innerHTML = originalText;
            btn.style.background = 'var(--danger)';
            btn.style.color = '#fff';
            btn.disabled = false;
            document.getElementById('rescue-condition').value = '';

            // Ir al radar para ver la nueva alerta
            const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
            if (radarTab) radarTab.click();
        }, 800);
    }, 1000);
}

/* --- INITIALIZATION --- */
function init() {
    Router.init();
    initRescueTabs();
    LocationManager.init();

    // Listener para inicialización de mapas cuando se entra en la pantalla de rescate
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (link.getAttribute('data-screen') === 'rescue') {
                // Pequeño delay para dejar que la pantalla se vuelva visible y Leaflet tome bien las medidas
                setTimeout(() => {
                    const activeTab = document.querySelector('.rescue-tab.active');
                    if (activeTab) {
                        const id = activeTab.getAttribute('data-tab');
                        if (id === 'report') initRescueMap();
                        else if (id === 'radar') initRadarMap();
                    }
                }, 100);
            }
        });
    });

    // Forzar inicialización si ya estamos en la pantalla (útil para recargas)
    if (Router.activeScreen === 'rescue') {
        setTimeout(initRescueMap, 300);
    }

    // Botones de acción SOS
    const submitBtn = document.getElementById('btn-submit-rescue');
    if (submitBtn) submitBtn.onclick = handleRescueSubmit;

    const locateBtn = document.getElementById('btn-locate-me');
    if (locateBtn) locateBtn.onclick = handleLocateMe;

    /* --- VET AI LOGIC --- */
    window.sendVetMessage = async (predefinedText) => {
        const input = document.getElementById('vet-input');
        const text = predefinedText || input.value.trim();
        if (!text) return;

        const chatContainer = document.getElementById('vet-ai-chat');

        // Añadir mensaje del usuario
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerText = text;
        chatContainer.appendChild(userBubble);

        if (!predefinedText) input.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Simular "IA escribiendo..." (Animación de carga real)
        const typing = document.createElement('div');
        typing.className = 'chat-bubble other';
        typing.id = 'ai-typing-indicator';
        typing.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Dra. Alma (v5.0) está escribiendo...';
        chatContainer.appendChild(typing);
        chatContainer.appendChild(typing);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            // Llamada REAL a la IA
            const aiResponseHtml = await getVetResponse(text);

            // Eliminar indicador de carga
            const typingIndicator = document.getElementById('ai-typing-indicator');
            if (typingIndicator) typingIndicator.remove();

            // Renderizar respuesta
            const reply = document.createElement('div');
            reply.className = 'chat-bubble other';
            reply.innerHTML = aiResponseHtml;
            chatContainer.appendChild(reply);
            chatContainer.scrollTop = chatContainer.scrollHeight;

        } catch (error) {
            console.error("Error en UI Vet:", error);
            const typingIndicator = document.getElementById('ai-typing-indicator');
            if (typingIndicator) typingIndicator.remove();

            const errReply = document.createElement('div');
            errReply.className = 'chat-bubble other error';
            errReply.innerText = "Error de conexión. Inténtalo de nuevo.";
            chatContainer.appendChild(errReply);
        }
    };


    const hf = document.getElementById('home-featured-list');
    if (hf) {
        hf.innerHTML = ''; // Limpiar placeholders
        animals.slice(0, 2).forEach(a => hf.appendChild(createAnimalCard(a)));
    }

    const cf = document.getElementById('full-catalog-list');
    if (cf) {
        cf.innerHTML = '';
        animals.forEach(a => cf.appendChild(createAnimalCard(a)));
    }

    // Social Hub init (if needed on load)
    if (window.switchSocialTab) window.switchSocialTab('heroes');
}

document.addEventListener('DOMContentLoaded', init);

// --- SOCIAL HUB LOGIC ---

/* --- SOCIAL HUB ENGINE --- */

window.switchSocialTab = (tabId) => {
    // 1. Update Tab UI (New Selector for Explicit Tabs)
    document.querySelectorAll('.social-tab-new').forEach(t => {
        t.style.background = '#222';
        t.style.color = 'gray';
        t.classList.remove('active');
    });

    const activeBtn = Array.from(document.querySelectorAll('.social-tab-new')).find(btn => btn.innerText.toLowerCase().includes(tabId.substring(0, 4)));
    if (activeBtn) {
        activeBtn.style.background = '#0a8e69'; // High contrast
        activeBtn.style.color = 'white';
        activeBtn.classList.add('active');
    }

    // 2. Render Content
    const container = document.getElementById('social-content');
    if (!container) return;

    if (tabId === 'heroes') {
        renderHeroesFeed(container);
    } else if (tabId === 'missions') {
        renderMissions(container);
    } else if (tabId === 'chat') {
        renderChat(container, 'general');
    } else if (tabId === 'success') {
        renderSuccessStories(container);
    }
};

const successStories = [
    {
        id: 1,
        name: 'Baltasar',
        breed: 'Mestizo de Vida',
        // Before: Sad, street, cold
        beforeImg: 'https://images.unsplash.com/photo-1529429617124-95b109e86bb8?q=80&w=1000&auto=format&fit=crop',
        // After: Happy, bed, home
        afterImg: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?q=80&w=1000&auto=format&fit=crop',
        story: 'Lo encontramos ovillado bajo la lluvia, invisible para el mundo. Tenía miedo hasta de comer. Hoy, Baltasar no solo tiene una cama caliente, tiene una familia que le lee cuentos antes de dormir. Su cola no ha parado de moverse desde que cruzó ese umbral.'
    },
    {
        id: 2,
        name: 'Luna y Sol',
        breed: 'Hermanos Inseparables',
        // Before: Dirty, scared kitten
        beforeImg: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1000&auto=format&fit=crop',
        // After: Clean, hugging, sleeping
        afterImg: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1000&auto=format&fit=crop',
        story: 'Sobrevivieron al invierno dándose calor mutuamente entre cartones. Prometimos no separarlos nunca. Ahora comparten el sofá más cómodo de la ciudad y han descubierto que las ventanas son en realidad televisiones de pájaros.'
    }
];

function renderSuccessStories(container) {
    container.innerHTML = '<div style="padding: 20px;"></div>';
    const list = container.querySelector('div');

    successStories.forEach(s => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.innerHTML = `
            <div class="story-header">
                <div>
                    <h4 style="margin:0; font-size:16px;">${s.name}</h4>
                    <span style="font-size:11px; color:var(--text-muted);">${s.breed}</span>
                </div>
                <i class="fa-solid fa-heart" style="color:var(--primary);"></i>
            </div>
            <div class="story-transformation" onclick="this.classList.toggle('reveal')">
                <img src="${s.beforeImg}" class="story-image before" alt="Antes">
                <img src="${s.afterImg}" class="story-image after" alt="Después">
                
                <span class="story-badge badge-before">ANTES</span>
                <span class="story-badge badge-after">AHORA</span>
                
                <div class="tap-hint" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.5); color:white; padding:10px 20px; border-radius:30px; font-size:12px; font-weight:700; pointer-events:none; backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,0.2); transition: opacity 0.3s;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> TOCAR
                </div>
            </div>
            <style>
                .story-transformation.reveal .tap-hint { opacity: 0; }
            </style>
            <div class="story-content">
                <p style="font-size:14px; line-height:1.6; color:#e0e0e0; font-weight:400; margin:0;">"${s.story}"</p>
            </div>
        `;
        list.appendChild(card);
    });
}



function renderHeroesFeed(container) {
    const leaderboardHTML = `
        <div class="leaderboard-container">
            <div class="leader-profile">
                <div class="leader-rank" style="background:silver;">2</div>
                <img src="https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop" style="width:45px; height:45px; border-radius:50%; border:2px solid silver; object-fit:cover;">
                <span style="font-size:11px; margin-top:5px; font-weight:700;">Carlos</span>
                <span style="font-size:10px; color:var(--primary);">950 XP</span>
            </div>
            <div class="leader-profile" style="transform: scale(1.1); margin-top:-10px;">
                <div class="leader-rank" style="background:#FFD700;">1</div>
                <img src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&auto=format&fit=crop" style="width:55px; height:55px; border-radius:50%; border:2px solid #FFD700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); object-fit:cover;">
                <span style="font-size:12px; margin-top:5px; font-weight:800; color:#FFD700;">María G.</span>
                <span style="font-size:10px; color:var(--primary);">1200 XP</span>
            </div>
            <div class="leader-profile">
                <div class="leader-rank" style="background:#cd7f32;">3</div>
                <img src="https://images.unsplash.com/photo-1579313262691-e490586e344e?q=80&w=200&auto=format&fit=crop" style="width:45px; height:45px; border-radius:50%; border:2px solid #cd7f32; object-fit:cover;">
                <span style="font-size:11px; margin-top:5px; font-weight:700;">Roberto</span>
                <span style="font-size:10px; color:var(--primary);">820 XP</span>
            </div>
        </div>
    `;

    const events = [
        { user: 'María G.', action: 'Donó 15€ para Rex', time: 'Hace 2 min', icon: 'fa-heart', color: '#ff3b30', img: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=200&auto=format&fit=crop' },
        { user: 'Carlos R.', action: 'Adoptó a Luna', time: 'Hace 1 hora', icon: 'fa-house', color: '#10fbba', img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=200&auto=format&fit=crop' },
        { user: 'Ana P.', action: 'Completó misión: Transporte', time: 'Hace 3 horas', icon: 'fa-car', color: '#FFD700', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=200&auto=format&fit=crop' },
        { user: 'Roberto', action: 'Nuevo Padrino Elite', time: 'Hace 5 horas', icon: 'fa-medal', color: '#bf5af2', img: 'https://images.unsplash.com/photo-1579313262691-e490586e344e?q=80&w=200&auto=format&fit=crop' }
    ];

    container.innerHTML = leaderboardHTML + '<h4 style="margin: 0 0 15px 5px; font-size:14px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">Actividad Reciente</h4>' + events.map(e => `
        <div class="feed-card">
            <img src="${e.img}" class="hero-avatar" alt="Avatar" style="object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop'">
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="font-size:15px; font-weight:700; color:white;">${e.user}</h4>
                    <span style="font-size:11px; color:var(--text-dim);"><i class="fa-regular fa-clock"></i> ${e.time}</span>
                </div>
                <p style="font-size:13px; color:var(--text-muted); margin-top:4px;">${e.action}</p>
            </div>
            <div class="action-icon" style="background: ${e.color}20; color: ${e.color};">
                <i class="fa-solid ${e.icon}"></i>
            </div>
        </div>
    `).join('') + '<div style="text-align:center; padding:20px;"><small style="color:var(--text-dim);">Estás al día</small></div>';
}

function renderMissions(container) {
    const missions = [
        { type: 'TRANSPORTE', title: 'Llevar a Toby al Vet', time: 'Hoy, 17:00', loc: 'Centro -> Clínica Sur', xp: 50, icon: 'fa-car' },
        { type: 'ACOGIDA', title: 'Casa temporal para gatitos', time: 'Urgente (3 días)', loc: 'Madrid Centro', xp: 150, icon: 'fa-house-chimney' },
        { type: 'EVENTO', title: 'Feria de Adopción', time: 'Sábado, 10:00', loc: 'Parque del Retiro', xp: 100, icon: 'fa-tent' }
    ];

    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="font-size:20px; font-weight:800;">Misiones Activas</h3>
            <span class="badge-elite" style="background:rgba(255,255,255,0.1); color:white;">Tu Nivel: 3</span>
        </div>
        ${missions.map(m => `
            <div class="mission-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span class="mission-tag">${m.type}</span>
                    <span style="font-weight:800; color:#FFD700; font-size:12px;">+${m.xp} XP</span>
                </div>
                <h4 style="font-size:18px; font-weight:700; margin-bottom:5px;">${m.title}</h4>
                <div style="display:flex; gap:15px; color:var(--text-muted); font-size:13px; margin-bottom:15px;">
                    <span><i class="fa-regular fa-clock"></i> ${m.time}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${m.loc}</span>
                </div>
                <button class="btn-join-mission">Me apunto <i class="fa-solid fa-arrow-right" style="margin-left:5px;"></i></button>
                <i class="fa-solid ${m.icon}" style="position:absolute; bottom:-10px; right:-10px; font-size:80px; opacity:0.05; transform:rotate(-15deg);"></i>
            </div>
        `).join('')}
    `;
}

window.socialMessages = window.socialMessages || {
    general: [
        { user: 'Elena R.', text: '¿Alguien sabe si el refugio necesita mantas ahora?', time: '10:30', avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=200&auto=format&fit=crop' },
        { user: 'Juan P.', text: 'Sí, Elena! Justo puse una alerta de misión', time: '10:32', avatar: 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200&auto=format&fit=crop', isMe: true },
        { user: 'Sofía L.', text: 'Yo puedo llevar algunas mañana por la tarde.', time: '10:35', avatar: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=200&auto=format&fit=crop' }
    ],
    emergency: [
        { user: 'Admin', text: '⚠️ Aviso: Gato atrapado en Calle Mayor 4. Se necesita escalera.', time: '09:15', avatar: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?q=80&w=200&auto=format&fit=crop' },
        { user: 'Carlos Bombero', text: 'Voy de camino con equipo.', time: '09:20', avatar: 'https://images.unsplash.com/photo-1616198906103-e8473de0e359?q=80&w=200&auto=format&fit=crop' }
    ],
    adoptions: [
        { user: 'Ana', text: '¡Mirad qué feliz está Rex en su nueva casa!', time: 'Ayer', avatar: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=200&auto=format&fit=crop' }
    ]
};

window.sendSocialMessage = (channel) => {
    const input = document.getElementById('social-chat-input');
    if (!input || !input.value.trim()) return;

    const msg = {
        user: Auth.user ? Auth.user.name : 'Invitado',
        text: input.value.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: Auth.user ? Auth.user.avatar : 'https://images.unsplash.com/photo-1534251369789-5067c8b8dc32?q=80&w=200',
        isMe: true
    };

    window.socialMessages[channel].push(msg);
    renderChat(document.getElementById('social-content'), channel);
};

function renderChat(container, channel = 'general') {
    // 1. Storage check
    if (!window.socialMessages[channel]) window.socialMessages[channel] = [];
    const messages = window.socialMessages[channel];

    // Channels UI
    const channels = [
        { id: 'general', name: '# General' },
        { id: 'emergency', name: '🚨 Emergencias' },
        { id: 'adoptions', name: '🏠 Adopciones' }
    ];

    const channelsHTML = `
        <div class="channel-selector">
            ${channels.map(c => `<div class="channel-pill ${c.id === channel ? 'active' : ''}" onclick="window.renderChat(document.getElementById('social-content'), '${c.id}')">${c.name}</div>`).join('')}
        </div>
    `;

    container.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            ${channelsHTML}
            <div id="community-chat-messages" style="flex: 1; overflow-y:auto; display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; padding-bottom:10px; max-height: 400px;">
                ${messages.map(msg => `
                    <div style="display: flex; gap: 10px; ${msg.isMe ? 'flex-direction: row-reverse;' : ''}">
                        <img src="${msg.avatar}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
                        <div style="${msg.isMe ? 'background: rgba(16, 251, 186, 0.1); border-radius: 15px 0 15px 15px;' : 'background: rgba(255,255,255,0.05); border-radius: 0 15px 15px 15px;'} padding: 10px 15px;">
                            ${!msg.isMe ? `<h5 style="color: var(--accent); font-size: 12px; margin-bottom: 2px;">${msg.user}</h5>` : ''}
                            <p style="font-size: 13px; color: ${msg.isMe ? '#fff' : '#ddd'};">${msg.text}</p>
                            <span style="font-size:9px; color:var(--text-dim); display:block; margin-top:4px; text-align:right;">${msg.time}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Input Area -->
            <div style="display: flex; gap: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <input type="text" id="social-chat-input" placeholder="Escribe en ${channels.find(c => c.id === channel).name}..." 
                    style="flex: 1; background: transparent; border: none; color: white; padding: 0 10px; outline: none;"
                    onkeypress="if(event.key === 'Enter') window.sendSocialMessage('${channel}')">
                <button onclick="window.sendSocialMessage('${channel}')" 
                    style="width: 35px; height: 35px; background: var(--primary); border-radius: 50%; border: none; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                    <i class="fa-solid fa-paper-plane" style="font-size: 14px;"></i>
                </button>
            </div>
        </div>
    `;

    // Auto-scroll
    setTimeout(() => {
        const chatBox = document.getElementById('community-chat-messages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }, 50);

    // Quick Fix: Expose helper for onclick
    window.renderChat = renderChat;

    // Quick Fix: Expose helper for onclick
    window.renderChat = renderChat;
}

// Init Social Hub logic if screen is active (or call manually)
// We create a global init for social to be safe
window.initSocialHub = () => {
    switchSocialTab('heroes');
};

// Add to global initialization or just run it once to populate default
setTimeout(() => {
    if (window.switchSocialTab) window.switchSocialTab('heroes');
}, 1000);


window.togglePointsGuide = () => {
    const modal = document.getElementById('info-modal');
    if (!modal) return;

    const content = modal.querySelector('.info-modal-content');

    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        // Render Content
        content.innerHTML = `
            <div class="info-header">
                <i class="fa-solid fa-shield-cat" style="font-size: 40px; color: var(--primary); margin-bottom: 10px;"></i>
                <h3 style="margin: 0; color: white; font-size: 22px; font-weight: 900;">EL CAMINO DEL HÉROE</h3>
                <p style="margin: 5px 0 0; color: #888; font-size: 13px;">Tu impacto real en la comunidad</p>
            </div>
            
            <div style="padding: 10px 0 30px;">
                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-truck-medical" style="color:#ff3b30;"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Guardián del SOS</strong>
                        <span class="xp-value">+500 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por reportar una emergencia real que resulte en un rescate exitoso.
                        </p>
                    </div>
                </div>

                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-hand-holding-heart" style="color:var(--primary);"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Alma Madrina</strong>
                        <span class="xp-value">+100 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por cada donación verificada o apadrinamiento de un animal.
                        </p>
                    </div>
                </div>

                <div class="xp-card">
                    <div class="xp-icon"><i class="fa-solid fa-bullhorn" style="color:#faa916;"></i></div>
                    <div>
                        <strong style="color:white; font-size:15px;">Voz de la Manada</strong>
                        <span class="xp-value">+50 XP</span>
                        <p style="margin: 5px 0 0; font-size: 11px; color: #888; line-height: 1.4;">
                            Por compartir casos urgentes y ayudar a difundir la misión.
                        </p>
                    </div>
                </div>

                <div style="text-align:center; margin-top:30px;">
                    <button onclick="togglePointsGuide()" style="background:var(--bg-dark); border:1px solid #333; color:white; padding:12px 30px; border-radius:20px; font-weight:bold; cursor:pointer;">
                        ENTENDIDO
                    </button>
                </div>
            </div>
        `;

    }
};

window.renderHomeNews = () => {
    const container = document.getElementById('home-news-feed');
    if (!container) return;

    const news = [
        {
            tag: 'LEGISLACIÓN',
            title: 'Nueva Ley de Bienestar: ¿Tienes ya tu seguro?',
            desc: 'Desde septiembre es obligatorio el seguro de responsabilidad civil para todos los perros. Evita multas de hasta 500€.',
            img: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1000&auto=format&fit=crop',
            readTime: '2 min lectura'
        },
        {
            tag: 'SALUD ESTACIONAL',
            title: 'Alerta de Calor: Cuidado con las almohadillas',
            desc: 'El asfalto alcanza 60°C hoy. La regla de oro: si quemas tu mano en 5s, quema sus patas. Pasea por la sombra.',
            img: 'https://images.unsplash.com/photo-1599147576161-1db5e3d74c86?q=80&w=1000&auto=format&fit=crop',
            readTime: 'Consejo rápido'
        }
    ];

    container.innerHTML = news.map(n => `
        <div class="news-card">
            <div style="position:relative;">
                <img src="${n.img}" class="news-image" alt="${n.title}">
                <span class="news-tag">${n.tag}</span>
            </div>
            <div class="news-content">
                <h4 style="font-size:16px; font-weight:800; line-height:1.4; margin-bottom:8px; color:white;">${n.title}</h4>
                <p style="font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:12px;">${n.desc}</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-dim); font-weight:600;"><i class="fa-regular fa-clock"></i> ${n.readTime}</span>
                    <button style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:700; cursor:pointer;">LEER MÁS</button>
                </div>
            </div>
        </div>
    `).join('');
};

window.navigateToRadar = () => {
    // 1. Go to Rescue Screen
    const rescueLink = document.querySelector('.nav-link[data-screen="rescue"]');
    if (rescueLink) rescueLink.click();

    // 2. Switch to Radar Tab (with small delay to ensure DOM is ready)
    setTimeout(() => {
        const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
        if (radarTab) radarTab.click();
    }, 100);
};

// Initialize Home News safely
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderHomeNews, 500);
});
// Also try immediately in case DOM is already ready (for hot reload)
renderHomeNews();

window.renderHomeNews = () => {
    const container = document.getElementById('home-news-feed');
    if (!container) return;

    const news = [
        {
            tag: 'LEGISLACIÓN',
            title: 'Nueva Ley de Bienestar: ¿Tienes ya tu seguro?',
            desc: 'Desde septiembre es obligatorio el seguro de responsabilidad civil para todos los perros. Evita multas de hasta 500€.',
            img: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1000&auto=format&fit=crop',
            readTime: '2 min lectura'
        },
        {
            tag: 'SALUD ESTACIONAL',
            title: 'Alerta de Calor: Cuidado con las almohadillas',
            desc: 'El asfalto alcanza 60°C hoy. La regla de oro: si quemas tu mano en 5s, quema sus patas. Pasea por la sombra.',
            img: 'https://images.unsplash.com/photo-1599147576161-1db5e3d74c86?q=80&w=1000&auto=format&fit=crop',
            readTime: 'Consejo rápido'
        }
    ];

    container.innerHTML = news.map(n => `
        <div class="news-card">
            <div style="position:relative;">
                <img src="${n.img}" class="news-image" alt="${n.title}">
                <span class="news-tag">${n.tag}</span>
            </div>
            <div class="news-content">
                <h4 style="font-size:16px; font-weight:800; line-height:1.4; margin-bottom:8px; color:white;">${n.title}</h4>
                <p style="font-size:13px; color:var(--text-muted); line-height:1.5; margin-bottom:12px;">${n.desc}</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:var(--text-dim); font-weight:600;"><i class="fa-regular fa-clock"></i> ${n.readTime}</span>
                    <button style="background:none; border:none; color:var(--primary); font-size:12px; font-weight:700; cursor:pointer;">LEER MÁS</button>
                </div>
            </div>
        </div>
    `).join('');
};

window.navigateToRadar = () => {
    // 1. Go to Rescue Screen
    const rescueLink = document.querySelector('.nav-link[data-screen="rescue"]');
    if (rescueLink) rescueLink.click();

    // 2. Switch to Radar Tab (with small delay to ensure DOM is ready)
    setTimeout(() => {
        const radarTab = document.querySelector('.rescue-tab[data-tab="radar"]');
        if (radarTab) radarTab.click();
    }, 100);
};

// Initialize Home News safely
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderHomeNews, 500);
});
// Also try immediately in case DOM is already ready (for hot reload)
renderHomeNews();

/* --- AUTH UI HANDLERS --- */
window.handleRegister = () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const spirit = document.getElementById('reg-spirit').value;

    if (name && email && pass) {
        Auth.register(name, email, pass, spirit);
        Auth.updateUI();
    } else {
        alert('Por favor completa todos los campos para unirte a la manada.');
    }
};

window.handleLogin = () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    if (Auth.login(email, pass)) {
        Auth.updateUI();
    } else {
        alert('Credenciales incorrectas. Inténtalo de nuevo.');
    }
};

window.showRegister = () => {
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-register').classList.add('active');
    document.querySelector('.bottom-nav').classList.add('hidden');
};

window.showLogin = () => {
    document.getElementById('screen-register').classList.remove('active');
    document.getElementById('screen-login').classList.add('active');
    document.querySelector('.bottom-nav').classList.add('hidden');
};

window.selectSpirit = (type, el) => {
    document.querySelectorAll('.animal-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('reg-spirit').value = type;
};

// Initialize Auth
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
});

window.renderProfile = () => {
    if (!Auth.user) return;

    document.querySelector('#screen-profile .user-avatar img').src = Auth.user.avatar;
    document.querySelector('#profile-name').innerText = Auth.user.name;
    document.querySelector('#stat-alerts').innerText = Auth.user.stats.alerts;
    document.querySelector('#stat-sponsored').innerText = Auth.user.stats.sponsored;

    const historyContainer = document.getElementById('profile-history');
    historyContainer.innerHTML = Auth.user.history.map(h => `
        <div style="background: var(--bg-surface); padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 15px;">
            <div style="background: rgba(255,255,255,0.05); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid ${h.icon || 'fa-star'}"></i>
            </div>
            <div>
                <strong style="display: block; font-size: 13px;">${h.action}</strong>
                <span style="font-size: 11px; color: var(--text-muted);">${h.date}</span>
            </div>
        </div>
    `).join('');
};

/* --- PWA INSTALL LOGIC --- */
const InstallApp = {
    deferredPrompt: null,
    isIos: /iPhone|iPad|iPod/.test(navigator.userAgent),

    init() {
        console.log('📱 PWA Init detectado');

        // Listen for install prompt (Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('✅ Install prompt captured');
        });

        // Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

        if (isStandalone) {
            console.log('🚀 App is in standalone mode - Skipping Landing');
            this.skipInstall();
        } else {
            // Show iOS specific hints if needed
            if (this.isIos) {
                const helper = document.getElementById('ios-helper');
                if (helper) helper.style.display = 'block';
            }
        }
    },

    handleInstall() {
        console.log('👇 Install button clicked');
        const btn = document.getElementById('btn-install-pwa');
        const originalContent = btn ? btn.innerHTML : '';

        if (this.isIos) {
            // iOS: Show Instructions Modal
            const modal = document.getElementById('ios-install-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
            return;
        }

        if (this.deferredPrompt) {
            // Start Feedback
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-sync fa-spin"></i> PREPARANDO...';
            }
            showToast("Iniciando instalación segura...", "info");

            setTimeout(() => {
                // Android/Desktop: Trigger Prompt
                this.deferredPrompt.prompt();

                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        showToast("¡Instalación iniciada! Revisa tu pantalla de inicio.", "success");
                        console.log('User accepted install');
                    } else {
                        showToast("Instalación cancelada.", "info");
                    }
                    this.deferredPrompt = null;
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                    }
                });
            }, 800);
        } else {
            // Fallback improved
            showToast("Sincronizando con el sistema... reintenta en 3 segundos.", "info");
            if (btn) {
                btn.classList.add('btn-loading');
                setTimeout(() => btn.classList.remove('btn-loading'), 2000);
            }
            console.warn('Install prompt not yet available');
        }
    },

    closeIosModal() {
        const modal = document.getElementById('ios-install-modal');
        if (modal) modal.classList.add('hidden');
    },

    skipInstall() {
        // Hide Landing, Show Auth or Home
        const landing = document.getElementById('screen-landing');
        if (landing) {
            landing.classList.remove('active');
            landing.style.display = 'none';
        }

        // Decide next screen based on Auth
        if (Auth.user) {
            document.getElementById('screen-home').classList.add('active');
            document.querySelector('.bottom-nav').classList.remove('hidden');
        } else {
            document.getElementById('screen-register').classList.add('active');
        }
    }
};

// Initialize PWA Logic immediately
InstallApp.init();

// Hacer InstallApp accesible globalmente para los onclick de HTML
window.InstallApp = InstallApp;


/* --- SERVICE WORKER CONTROL (v5.0) --- */
if ('serviceWorker' in navigator) {
    // 1. Primero desregistramos para matar la caché v3
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
            console.log('SW Desregistrado:', registration);
            registration.unregister();
        }
    }).then(() => {
        // 2. Registramos el nuevo
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                console.log('SW v5.0 Registered: ', registration);
            }).catch(registrationError => {
                console.log('SW Registration failed: ', registrationError);
            });
        });
    });
}
