// Quiz Data - Questions about Internet Security and Fake News
const quizData = [
    {
        id: 1,
        level: "Iniciante",
        question: "O que é uma Fake News?",
        options: [
            {
                text: "Um erro de digitação em uma reportagem",
                correct: false,
                feedback: "Não, um erro de digitação é apenas um erro simples. Fake news é algo muito mais grave."
            },
            {
                text: "Uma fofoca entre amigos",
                correct: false,
                feedback: "Fofocas não são necessariamente fake news públicas. As fake news são informações falsas disseminadas em massa."
            },
            {
                text: "Uma informação falsa divulgada como se fosse verdadeira",
                correct: true,
                feedback: "Correto! Fake news são informações fabricadas ou distorcidas apresentadas como fatos verdadeiros para enganar as pessoas."
            },
            {
                text: "Uma notícia verdadeira publicada por um jornal",
                correct: false,
                feedback: "Não, isso seria uma notícia legítima. As fake news são sempre falsas ou enganosas."
            }
        ]
    },
    {
        id: 2,
        level: "Iniciante",
        question: "Como você pode ajudar a prevenir o compartilhamento de fake news?",
        options: [
            {
                text: "Compartilhar tudo sem verificar a fonte",
                correct: false,
                feedback: "Nunca! Sempre verifique a fonte antes de compartilhar qualquer informação importante."
            },
            {
                text: "Verificar a fonte, consultar fatos e não compartilhar se estiver incerto",
                correct: true,
                feedback: "Excelente! Sempre verifique a credibilidade da fonte e confirme os fatos antes de compartilhar."
            },
            {
                text: "Confiar apenas no que seus amigos compartilham",
                correct: false,
                feedback: "Amigos bem-intencionados também podem compartilhar informações falsas sem saber."
            },
            {
                text: "Compartilhar tudo que pareça importante",
                correct: false,
                feedback: "Só porque algo parece importante não significa que é verdadeiro. Sempre verifique!"
            }
        ]
    },
    {
        id: 3,
        level: "Intermediário",
        question: "O que é Phishing?",
        options: [
            {
                text: "Pesca de verdade",
                correct: false,
                feedback: "Não, phishing é um termo técnico de segurança. A palavra \"phishing\" é um jogo de palavras com \"fishing\" (pesca)."
            },
            {
                text: "Um ataque cibernético que engana pessoas para roubar informações pessoais",
                correct: true,
                feedback: "Correto! Phishing é quando golpistas fingem ser pessoas confiáveis para roubar suas informações sensíveis."
            },
            {
                text: "Um software que protege seu computador",
                correct: false,
                feedback: "Não, phishing é justamente uma ameaça, não uma proteção."
            },
            {
                text: "Um tipo de vírus que destrói arquivos",
                correct: false,
                feedback: "Phishing não é um vírus. É uma técnica de engenharia social para enganar pessoas."
            }
        ]
    },
    {
        id: 4,
        level: "Intermediário",
        question: "Qual é a senha mais segura?",
        options: [
            {
                text: "Sua data de nascimento (ex: 12051990)",
                correct: false,
                feedback: "Datas de nascimento são fáceis de descobrir ou adivinhar. Não use informações pessoais."
            },
            {
                text: "Uma mistura de letras maiúsculas, minúsculas, números e símbolos",
                correct: true,
                feedback: "Perfeito! Senhas fortes combinam diferentes tipos de caracteres e são longas (mínimo 12 caracteres)."
            },
            {
                text: "Seu nome + um número (ex: João123)",
                correct: false,
                feedback: "Senhas com seu nome são fracas. Os criminosos tentam primeiro informações pessoais."
            },
            {
                text: "Uma palavra do dicionário (ex: Gato2024)",
                correct: false,
                feedback: "Palavras de dicionário podem ser quebradas rapidamente usando ferramentas de ataque. Use uma combinação aleatória."
            }
        ]
    },
    {
        id: 5,
        level: "Intermediário",
        question: "O que você deve fazer se receber um email suspeito pedindo seu usuário e senha?",
        options: [
            {
                text: "Responder com seus dados para confirmar sua identidade",
                correct: false,
                feedback: "Nunca! Empresas legítimas nunca pedem dados sensíveis por email. Isso é phishing!"
            },
            {
                text: "Clicar no link para verificar se é verdadeiro",
                correct: false,
                feedback: "Muito perigoso! O link pode levar a um site falso. Sempre vá diretamente ao site da empresa no navegador."
            },
            {
                text: "Ignorar ou denunciar como spam/phishing",
                correct: true,
                feedback: "Correto! Sempre desconfie de emails inesperados pedindo informações pessoais."
            },
            {
                text: "Enviar para seus amigos para eles também verificarem",
                correct: false,
                feedback: "Não! Isso pode ajudar os criminosos. Simplesmente delete ou denuncie."
            }
        ]
    },
    {
        id: 6,
        level: "Avançado",
        question: "Como você deve se proteger ao usar Internet em WiFi público?",
        options: [
            {
                text: "Não usar qualquer site que peça senha",
                correct: false,
                feedback: "Bem conservador, mas existem maneiras mais práticas de se proteger."
            },
            {
                text: "Usar uma VPN (Rede Privada Virtual) para criptografar sua conexão",
                correct: true,
                feedback: "Excelente! Uma VPN criptografa seus dados e impede que pessoas na mesma rede os vejam."
            },
            {
                text: "Confiar que a rede é segura porque tem um grande número de usuários",
                correct: false,
                feedback: "Não, a quantidade de usuários não garante segurança. WiFis públicas são ambientes arriscados."
            },
            {
                text: "Usar qualquer rede WiFi sem restrições",
                correct: false,
                feedback: "WiFis públicas são vulneráveis. Sempre proteja sua conexão."
            }
        ]
    },
    {
        id: 7,
        level: "Iniciante",
        question: "Qual informação pessoal É SEGURO compartilhar nas redes sociais?",
        options: [
            {
                text: "Seu número de documento de identidade",
                correct: false,
                feedback: "Nunca compartilhe documentos! Podem ser usados para fraude."
            },
            {
                text: "Sua localização em tempo real",
                correct: false,
                feedback: "Perigoso! Pode permitir que criminosos saibam quando você não está em casa."
            },
            {
                text: "Informações gerais como sua profissão ou hobbies favoritos",
                correct: true,
                feedback: "Correto! Informações gerais podem ser compartilhadas. Evite dados sensíveis como endereço completo, telefone ou dados bancários."
            },
            {
                text: "Sua senha de email ou redes sociais",
                correct: false,
                feedback: "Nunca! Suas senhas são o acesso principal às suas contas. Mantenha-as absolutamente privadas."
            }
        ]
    },
    {
        id: 8,
        level: "Avançado",
        question: "Como identificar um site falso (site de phishing)?",
        options: [
            {
                text: "Observar se a URL começar com \"https://\" e tem um cadeado",
                correct: true,
                feedback: "Bom! Um site seguro deve ter HTTPS. Porém, note a URL com cuidado - \"https://amz0n.com\" é falso mesmo com HTTPS."
            },
            {
                text: "Se o site tem um logo similar ao original, é confiável",
                correct: false,
                feedback: "Não! Sites falsos frequentemente copiam logos de sites legítimos. Verifique a URL!"
            },
            {
                text: "Se o site pede muitas informações pessoais, é seguro",
                correct: false,
                feedback: "Aviso! Sites legítimos pedem informações apenas quando necessário. Muitas solicitações = suspeita."
            },
            {
                text: "Se o endereço (URL) é levemente diferente do original",
                correct: false,
                feedback: "Isso pode ser phishing! Criminosos usam URLs muito similares. Verifique character por character!"
            }
        ]
    },
    {
        id: 9,
        level: "Intermediário",
        question: "O que você deve fazer para se proteger do Cyberbullying?",
        options: [
            {
                text: "Manter configurações de privacidade abertas para todos",
                correct: false,
                feedback: "Não! Configure sua privacidade para limitar quem pode ver suas publicações."
            },
            {
                text: "Bloquear contatos suspeitos, não compartilhar fotos íntimas e denunciar abusos",
                correct: true,
                feedback: "Correto! Proteja sua privacidade, controle o acesso ao seu perfil e denuncie comportamento ofensivo."
            },
            {
                text: "Responder agressivamente aos comentários negativos",
                correct: false,
                feedback: "Não, isso pode piorar a situação. Denuncie em vez de responder."
            },
            {
                text: "Aceitar solicitações de amizade de desconhecidos",
                correct: false,
                feedback: "Cuidado! Pessoas más podem se passar por outras pessoas para bullying ou scams."
            }
        ]
    },
    {
        id: 10,
        level: "Avançado",
        question: "Por que é importante manter seu software e antivírus atualizados?",
        options: [
            {
                text: "Apenas para ter mais espaço no computador",
                correct: false,
                feedback: "Não, atualizações ocupam espaço. Elas resolvem problemas de segurança!"
            },
            {
                text: "Para corrigir vulnerabilidades de segurança e proteger contra novas ameaças",
                correct: true,
                feedback: "Excelente! Atualizações corrigem buracos de segurança que criminosos exploram. Sempre atualize!"
            },
            {
                text: "Porque o sistema obriga",
                correct: false,
                feedback: "Bem, o sistema sugere, mas o motivo real é importantíssimo: sua segurança!"
            },
            {
                text: "Para deixar o computador mais lento",
                correct: false,
                feedback: "Não! Embora atualizações possam consumir recursos, a proteção vale a pena."
            }
        ]
    }
];
