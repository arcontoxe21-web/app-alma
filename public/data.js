/**
 * Alma Elite Data v1.0
 * Datos compartidos para toda la aplicación
 */

window.animals = [
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

window.posts = [
    { id: 1, author: 'Marta Soler', text: 'MAXIMUS hoy nos ha dado una lección de coraje.', img: window.animals[0].imageUrl, likes: 45, time: '1h' },
    { id: 2, author: 'Refugio Alma', text: 'Nuevas llegadas al santuario.', img: window.animals[1].imageUrl, likes: 89, time: '3h' }
];

window.news = [
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

window.missions = [
    { type: 'TRANSPORTE', title: 'Llevar a Toby al Vet', time: 'Hoy, 17:00', loc: 'Centro -> Clínica Sur', xp: 50, icon: 'fa-car' },
    { type: 'ACOGIDA', title: 'Casa temporal para gatitos', time: 'Urgente (3 días)', loc: 'Madrid Centro', xp: 150, icon: 'fa-house-chimney' },
    { type: 'EVENTO', title: 'Feria de Adopción', time: 'Sábado, 10:00', loc: 'Parque del Retiro', xp: 100, icon: 'fa-tent' }
];

console.log('📦 Data System v1.0 cargado correctamente');
