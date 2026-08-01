export type Article = {
  id: string
  title: string
  excerpt?: string
  category: string
  image: string
  time: string
  author?: string
  urgent?: boolean
}

export const categories = [
  'Política',
  'Economia',
  'Mundo',
  'Tecnologia',
  'Esportes',
  'Saúde',
  'Cultura',
  'Meio Ambiente',
]

export const heroArticle: Article = {
  id: 'hero',
  title:
    'Congresso aprova nova reforma e governo comemora avanço em pauta econômica',
  excerpt:
    'Após semanas de negociação, o texto foi aprovado em votação apertada e agora segue para sanção. Entenda os principais pontos e como as mudanças afetam o seu bolso.',
  category: 'Política',
  image: '/news/hero-congress.png',
  time: 'há 12 min',
  author: 'Redação',
  urgent: true,
}

export const featuredArticles: Article[] = [
  {
    id: 'f1',
    title: 'Bolsa fecha em alta e dólar recua com otimismo dos investidores',
    excerpt:
      'Mercado reage a dados de inflação abaixo do esperado e projeta corte de juros.',
    category: 'Economia',
    image: '/news/economy.png',
    time: 'há 34 min',
  },
  {
    id: 'f2',
    title: 'Nova geração de inteligência artificial promete revolucionar o trabalho',
    excerpt:
      'Empresas de tecnologia apresentam ferramentas capazes de automatizar tarefas complexas.',
    category: 'Tecnologia',
    image: '/news/technology.png',
    time: 'há 1 h',
  },
  {
    id: 'f3',
    title: 'Seleção vence de virada e garante vaga na próxima fase do torneio',
    excerpt:
      'Time se recupera no segundo tempo e conquista classificação com gol nos acréscimos.',
    category: 'Esportes',
    image: '/news/sports.png',
    time: 'há 2 h',
  },
  {
    id: 'f4',
    title: 'Estudo aponta avanço em tratamento inédito contra doença crônica',
    excerpt:
      'Pesquisadores comemoram resultados promissores em testes clínicos de larga escala.',
    category: 'Saúde',
    image: '/news/health.png',
    time: 'há 3 h',
  },
  {
    id: 'f5',
    title: 'Cúpula internacional termina com acordo histórico sobre clima',
    excerpt:
      'Líderes de mais de 60 países fecham compromisso com metas ambiciosas de redução de emissões.',
    category: 'Mundo',
    image: '/news/world.png',
    time: 'há 4 h',
  },
  {
    id: 'f6',
    title: 'Amazônia registra menor índice de desmatamento da década',
    excerpt:
      'Dados de monitoramento por satélite apontam queda expressiva no desmate no último ano.',
    category: 'Meio Ambiente',
    image: '/news/environment.png',
    time: 'há 5 h',
  },
  {
    id: 'f7',
    title: 'Festival de música movimenta o fim de semana na capital',
    excerpt:
      'Mais de 200 mil pessoas são esperadas para shows gratuitos em três palcos espalhados pela cidade.',
    category: 'Cultura',
    image: '/news/culture.png',
    time: 'há 6 h',
  },
  {
    id: 'f8',
    title: 'Senado analisa pacote de reformas administrativas',
    excerpt:
      'Proposta tramita em regime de urgência e deve ser votada nas próximas semanas.',
    category: 'Política',
    image: '/news/politics-small.png',
    time: 'há 7 h',
  },
]

export const mostRead: Article[] = [
  {
    id: 'm1',
    title: 'Entenda as novas regras de imposto de renda que entram em vigor',
    category: 'Economia',
    image: '/news/economy.png',
    time: 'há 5 h',
  },
  {
    id: 'm2',
    title: 'Desmatamento na Amazônia registra menor índice da década',
    category: 'Meio Ambiente',
    image: '/news/environment.png',
    time: 'há 6 h',
  },
  {
    id: 'm3',
    title: 'Cúpula internacional reúne líderes para discutir crise climática',
    category: 'Mundo',
    image: '/news/world.png',
    time: 'há 7 h',
  },
  {
    id: 'm4',
    title: 'Festival de cultura movimenta a cidade com shows gratuitos',
    category: 'Cultura',
    image: '/news/culture.png',
    time: 'há 8 h',
  },
  {
    id: 'm5',
    title: 'Governo anuncia pacote de investimentos em infraestrutura',
    category: 'Política',
    image: '/news/politics-small.png',
    time: 'há 9 h',
  },
]

export const latestNews: Article[] = [
  {
    id: 'l1',
    title: 'Câmara analisa projeto que altera regras do setor de energia',
    category: 'Política',
    image: '/news/politics-small.png',
    time: 'há 3 min',
    urgent: true,
  },
  {
    id: 'l2',
    title: 'Startups brasileiras batem recorde de captação no trimestre',
    category: 'Tecnologia',
    image: '/news/technology.png',
    time: 'há 18 min',
  },
  {
    id: 'l3',
    title: 'Clube confirma contratação de técnico para a próxima temporada',
    category: 'Esportes',
    image: '/news/sports.png',
    time: 'há 27 min',
  },
  {
    id: 'l4',
    title: 'Nova exposição reúne obras raras no centro cultural da capital',
    category: 'Cultura',
    image: '/news/culture.png',
    time: 'há 41 min',
  },
  {
    id: 'l5',
    title: 'Relatório aponta recuperação do turismo em regiões litorâneas',
    category: 'Economia',
    image: '/news/economy.png',
    time: 'há 55 min',
  },
]

export type Columnist = {
  id: string
  name: string
  role: string
  avatar: string
  headline: string
}

export const columnists: Columnist[] = [
  {
    id: 'c1',
    name: 'Mariana Costa',
    role: 'Política & Poder',
    avatar: '/news/columnist-1.png',
    headline:
      'O jogo de bastidores que definiu a votação e o que esperar dos próximos meses.',
  },
  {
    id: 'c2',
    name: 'Ricardo Almeida',
    role: 'Economia',
    avatar: '/news/columnist-2.png',
    headline:
      'Por que o corte de juros pode chegar antes do previsto — e quem ganha com isso.',
  },
  {
    id: 'c3',
    name: 'Beatriz Nunes',
    role: 'Tecnologia & Sociedade',
    avatar: '/news/columnist-3.png',
    headline:
      'A inteligência artificial no trabalho: entre a promessa e o receio de quem produz.',
  },
]

export type Video = {
  id: string
  title: string
  duration: string
  thumbnail: string
  category: string
}

export const videos: Video[] = [
  {
    id: 'v1',
    title: 'Boletim da noite: os destaques do dia em 5 minutos',
    duration: '05:12',
    thumbnail: '/news/video-1.png',
    category: 'Jornal',
  },
  {
    id: 'v2',
    title: 'Carros elétricos: o futuro da mobilidade já chegou às cidades',
    duration: '08:47',
    thumbnail: '/news/video-2.png',
    category: 'Tecnologia',
  },
  {
    id: 'v3',
    title: 'Na cozinha: receitas rápidas para o dia a dia',
    duration: '12:30',
    thumbnail: '/news/video-3.png',
    category: 'Lifestyle',
  },
]
