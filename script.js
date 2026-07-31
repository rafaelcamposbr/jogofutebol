(() => {
  "use strict";

  const STORAGE_KEY = "football-club-manager-prototype-v1";
  const MS_MINUTE = 60 * 1000;
  const MS_DAY = 24 * 60 * MS_MINUTE;
  const PROVISIONAL_YOUTH_ACADEMY_BUILD_TIME_DAYS = 4;
  const PROVISIONAL_TRYOUT_DURATION_MINUTES = 1;
  const PROVISIONAL_GRANT_INSTALLMENTS = 6;
  const PROVISIONAL_STAFF_COURSE_DAYS = 7;
  const PROVISIONAL_STAFF_COURSE_COST = 1200;
  const APP_ENV = globalThis.__APP_ENV__ || "beta";
  const APP_VERSION = globalThis.__APP_VERSION__ || "0.1.0";
  const PROVISIONAL_REPUTATION_IMPACTS = {
    grantDefaultInstitutional: -0.35,
    grantDefaultFinancial: -0.25,
    sponsorshipAcceptedFinancial: 0.03,
    notableStaffHireInstitutional: 0.04,
  };

  const LEVELS = [
    { id: "simples", label: "Simples", value: 25 },
    { id: "basico", label: "Basico", value: 50 },
    { id: "moderno", label: "Moderno", value: 75 },
    { id: "sofisticado", label: "Sofisticado", value: 100 },
  ];

  const NAV_ITEMS = [
    { id: "central", view: "overview", label: "Central", icon: "CE", route: "/central" },
    { id: "press", view: "pressFeed", label: "Imprensa", icon: "IM", route: "/imprensa" },
    { id: "squad", view: "squad", label: "Elenco", icon: "EL", route: "/elenco" },
    { id: "market", view: "marketPlayers", label: "Mercado", icon: "ME", route: "/mercado" },
    { id: "office", view: "finances", label: "Escrit&oacute;rio", icon: "ES", route: "/escritorio" },
    { id: "calendar", view: "calendarAgenda", label: "Calend&aacute;rio", icon: "CA", route: "/calendario" },
  ];

  const VIEW_INFO = {
    overview: {
      title: "Vis&atilde;o Geral",
      subtitle: "Painel inicial do clube, com tempo real simulado e eventos persistentes.",
    },
    foundation: {
      title: "Funda&ccedil;&atilde;o",
      subtitle: "Recursos iniciais, modelo juridico e promessas publicas.",
    },
    finances: {
      title: "Finan&ccedil;as",
      subtitle: "Caixa, despesas mensais, cobrancas previstas e historico financeiro.",
    },
    reputation: {
      title: "Reputa&ccedil;&atilde;o",
      subtitle: "Indicadores institucionais, financeiros e esportivos do clube.",
    },
    sponsorship: {
      title: "Patroc&iacute;nios",
      subtitle: "Cotas comerciais, propostas simuladas e contratos ativos.",
    },
    staff: {
      title: "Funcion&aacute;rios",
      subtitle: "Busca, propostas, equipe atual, folha salarial e desenvolvimento dos profissionais.",
    },
    property: {
      title: "Patrim&ocirc;nio",
      subtitle: "Resumo de bens, instalacoes, manutencao e obras.",
    },
    rooms: {
      title: "Salas Administrativas",
      subtitle: "Compra ou aluguel de salas externas com capacidade de funcionarios.",
    },
    land: {
      title: "Terrenos",
      subtitle: "Compra de areas para sede, CT e estadio proprio.",
    },
    training: {
      title: "Centro de Treinamento",
      subtitle: "Obras de instalacoes, ocupacao do terreno e beneficios estruturais.",
    },
    stadium: {
      title: "Est&aacute;dio",
      subtitle: "Estadio municipal, modulos proprios, ampliacoes e reformas.",
    },
    youth: {
      title: "Categoria de Base",
      subtitle: "Qualidade de formacao, componentes e jovens ficticios.",
    },
    squad: {
      title: "Elenco",
      subtitle: "Peneiras, atletas encontrados, contratacoes e jogos-treino internos.",
    },
    events: {
      title: "Eventos",
      subtitle: "Historico geral de decisoes, contratos, obras, dividas e reputacao.",
    },
    settings: {
      title: "Configura&ccedil;&otilde;es",
      subtitle: "Dados locais do prototipo e reinicio completo.",
    },
    pressFeed: {
      title: "Arquibancada",
      subtitle: "Feed social publico com acontecimentos relevantes do universo do jogo.",
    },
    pressClub: {
      title: "Meu Clube",
      subtitle: "Feed privado com rotinas e links internos do proprio clube.",
    },
    pressMarket: {
      title: "Mercado da Bola",
      subtitle: "Noticias publicas de jogadores, transferencias e valorizacoes.",
    },
    pressHorizon: {
      title: "Jornal Horizonte",
      subtitle: "Veiculo oficial com filtros por cidade, regiao, estado e alcance nacional.",
    },
    pressCommunications: {
      title: "Comunicados Oficiais",
      subtitle: "Notas a imprensa, rascunhos, publicacoes e repercussao do proprio clube.",
    },
    pressClubSearch: {
      title: "Busca de Clubes",
      subtitle: "Busca simulada de perfis publicos por nome, sigla, cidade, estado ou hashtag.",
    },
    pressPublicProfile: {
      title: "Perfil P&uacute;blico",
      subtitle: "Pagina publica de clube com dados visiveis no universo do jogo.",
    },
    squadTraining: {
      title: "Treinamentos",
      subtitle: "Programacao semanal, intensidade e uso de instalacoes.",
    },
    squadMedical: {
      title: "Departamento M&eacute;dico",
      subtitle: "Prevencao, profissionais e estrutura medica disponivel.",
    },
    squadInternal: {
      title: "Jogos-Treino",
      subtitle: "Treinos internos sem adversarios artificiais.",
    },
    marketPlayers: {
      title: "Mercado",
      subtitle: "Negociacoes externas e atletas sem contrato no prototipo.",
    },
    marketObservation: {
      title: "Observa&ccedil;&atilde;o",
      subtitle: "Olheiros, interesses e relatorios simples.",
    },
    marketTryouts: {
      title: "Peneiras",
      subtitle: "Criacao de peneiras e atletas encontrados.",
    },
    marketRealEstate: {
      title: "Mercado de Im&oacute;veis",
      subtitle: "Ofertas ficticias de salas e terrenos.",
    },
    marketHistory: {
      title: "Hist&oacute;rico do Mercado",
      subtitle: "Compras, contratacoes, propostas e negociacoes encerradas.",
    },
    installations: {
      title: "Instala&ccedil;&otilde;es",
      subtitle: "Estadio, CT, salas e terrenos reunidos em uma area administrativa.",
    },
    administration: {
      title: "Administra&ccedil;&atilde;o",
      subtitle: "Modelo juridico, fundacao, promessas, recursos institucionais e configuracoes.",
    },
    calendarAgenda: {
      title: "Calend&aacute;rio",
      subtitle: "Agenda do tempo real do clube.",
    },
    calendarUpcoming: {
      title: "Pr&oacute;ximos Eventos",
      subtitle: "Obras, vencimentos, pagamentos, contratos e propostas expirando.",
    },
    calendarCompleted: {
      title: "Eventos Conclu&iacute;dos",
      subtitle: "Historico de eventos ja processados pelo jogo.",
    },
    calendarSchedules: {
      title: "Programa&ccedil;&otilde;es",
      subtitle: "Treinos, pagamentos, comunicados e utilizacao futura de instalacoes.",
    },
    calendarAlerts: {
      title: "Alertas",
      subtitle: "Eventos criticos e riscos que exigem atencao do dirigente.",
    },
  };

  const DONATIONS = [
    {
      id: "horizonte",
      name: "Instituto Horizonte Comunitario",
      amount: 17539.21,
    },
    {
      id: "vale-dourado",
      name: "Grupo Comercial Vale Dourado",
      amount: 37884.69,
    },
    {
      id: "caminhos-esporte",
      name: "Fundacao Caminhos do Esporte",
      amount: 49460.57,
    },
  ];

  const ADMIN_ROOM_OPTIONS = [
    { id: "suburbio", label: "Suburbio", purchase: 17834.4, rent: 713.38 },
    { id: "bairro-pequeno", label: "Bairro pequeno", purchase: 29724, rent: 1188.96 },
    { id: "bairro-tradicional", label: "Bairro tradicional", purchase: 41613.6, rent: 1664.54 },
    { id: "area-nobre", label: "Area nobre", purchase: 59448, rent: 2377.92 },
  ];

  const LAND_ZONES = [
    { id: "suburbio", label: "Suburbio", priceM2: 1486.2 },
    { id: "bairro-pequeno", label: "Bairro pequeno", priceM2: 2477 },
    { id: "bairro-tradicional", label: "Bairro tradicional", priceM2: 3467.8 },
    { id: "area-nobre", label: "Area nobre", priceM2: 4954 },
  ];

  const CT_FACILITIES = [
    {
      id: "training-field",
      label: "Campo de treino",
      area: 11000,
      buildDays: 2,
      costs: { simples: 67498.22, basico: 87747.69, moderno: 107997.15, sofisticado: 134996.44 },
      benefit: "Teto tecnico para treinos diarios.",
    },
    {
      id: "lodging",
      label: "Alojamento",
      area: 360,
      buildDays: 3,
      costs: { simples: 153548.9, basico: 230323.35, moderno: 345485.03, sofisticado: 460646.7 },
      capacities: { simples: 12, basico: 24, moderno: 40, sofisticado: 60 },
      benefit: "Capacidade de hospedagem para atletas.",
    },
    {
      id: "gym",
      label: "Academia",
      area: 200,
      buildDays: 2,
      costs: { simples: 153704.04, basico: 307408.08, moderno: 461112.12, sofisticado: 614816.16 },
      benefit: "Aumenta o teto fisico do elenco.",
    },
    {
      id: "medical",
      label: "Instalacao medica",
      area: 200,
      buildDays: 3,
      costs: { simples: 38356.65, basico: 115069.95, moderno: 264660.89, sofisticado: 793982.66 },
      names: {
        simples: "Sala de Fisioterapia",
        basico: "Centro de Treinamento Fisico",
        moderno: "Centro de Preparacao e Reabilitacao",
        sofisticado: "Centro Clinico",
      },
      benefit: "Apoia recuperacao e prevencao de lesoes.",
    },
    {
      id: "youth-academy",
      label: "Categoria de base",
      area: 13000,
      buildDays: PROVISIONAL_YOUTH_ACADEMY_BUILD_TIME_DAYS,
      costs: { simples: 118681.19, basico: 154285.54, moderno: 189889.9, sofisticado: 237362.37 },
      benefit: "Estrutura de formacao de jovens.",
    },
    {
      id: "admin-room-ct",
      label: "Sala administrativa no CT",
      area: 80,
      buildDays: 4,
      special: "admin-room-ct",
      benefit: "6 funcionarios e 25% a mais de rendimento administrativo.",
    },
    {
      id: "admin-building-ct",
      label: "Predio administrativo no CT",
      area: 360,
      buildDays: 7,
      special: "admin-building-ct",
      benefit: "De 3 a 20 salas com 25% a mais de rendimento administrativo.",
    },
  ];

  const STADIUM_MODULES = [
    {
      seats: 1975,
      weeks: 1,
      costs: { simples: 210.22, basico: 231.24, moderno: 262.78, sofisticado: 294.31 },
    },
    {
      seats: 5926,
      weeks: 2,
      costs: { simples: 208.12, basico: 228.93, moderno: 260.15, sofisticado: 291.36 },
    },
    {
      seats: 10852,
      weeks: 3,
      costs: { simples: 204.96, basico: 225.46, moderno: 256.21, sofisticado: 286.95 },
    },
    {
      seats: 24889,
      weeks: 4,
      costs: { simples: 202.86, basico: 223.15, moderno: 253.58, sofisticado: 284.01 },
    },
  ];

  const SPONSOR_POSITIONS = [
    { id: "master", label: "Master", base: 62000 },
    { id: "peito-secundario", label: "Peito secundario", base: 28000 },
    { id: "costas", label: "Costas", base: 22000 },
    { id: "manga-direita", label: "Manga direita", base: 14000 },
    { id: "manga-esquerda", label: "Manga esquerda", base: 14000 },
    { id: "shorts", label: "Shorts", base: 11000 },
    { id: "meiao", label: "Meiao", base: 7500 },
    { id: "material", label: "Fornecedora de material esportivo", base: 36000 },
    { id: "naming-ct", label: "Naming rights do CT", base: 84000, requires: "ct" },
    { id: "naming-stadium", label: "Naming rights do estadio", base: 140000, requires: "stadium" },
    { id: "placas", label: "Placas de publicidade", base: 9000 },
    { id: "redes-sociais", label: "Redes sociais", base: 13000 },
    { id: "site-oficial", label: "Site oficial", base: 10000 },
  ];

  const COMPANY_NAMES = [
    "Banco Litoral",
    "NorteSul Alimentos",
    "Vitta Farma",
    "TecnoRota",
    "AgroBrava",
    "Solaris Energia",
    "Cimento Itapua",
    "Mercado Popular",
    "AutoPrime",
    "Futura Telecom",
  ];

  const FIRST_NAMES = ["Caio", "Davi", "Igor", "Ruan", "Lucas", "Breno", "Natan", "Tales", "Joao", "Mikael"];
  const LAST_NAMES = ["Silva", "Pereira", "Araujo", "Costa", "Moura", "Ribeiro", "Gomes", "Lima", "Santos", "Rocha"];
  const POSITIONS = ["GOL", "LD", "ZAG", "LE", "VOL", "MC", "MEI", "PD", "PE", "ATA"];

  const OFFICE_NAV_ITEMS = [
    { id: "finances", label: "Finan&ccedil;as", view: "finances", route: "/escritorio/financas" },
    { id: "property", label: "Patrim&ocirc;nio", view: "property", route: "/escritorio/patrimonio" },
    { id: "sponsorship", label: "Patroc&iacute;nios", view: "sponsorship", route: "/escritorio/patrocinios" },
    { id: "reputation", label: "Reputa&ccedil;&atilde;o", view: "reputation", route: "/escritorio/reputacao" },
    { id: "facilities", label: "Instala&ccedil;&otilde;es", view: "installations", route: "/escritorio/instalacoes" },
    { id: "staff", label: "Funcion&aacute;rios", view: "staff", route: "/escritorio/funcionarios" },
    { id: "administration", label: "Administra&ccedil;&atilde;o", view: "administration", route: "/escritorio/administracao" },
  ];

  const PRESS_NAV_ITEMS = [
    { id: "stands", label: "Arquibancada", view: "pressFeed", route: "/imprensa/arquibancada" },
    { id: "club", label: "Meu Clube", view: "pressClub", route: "/imprensa/meu-clube" },
    { id: "ball-market", label: "Mercado da Bola", view: "pressMarket", route: "/imprensa/mercado-da-bola" },
    { id: "horizon", label: "Jornal Horizonte", view: "pressHorizon", route: "/imprensa/jornal-horizonte" },
    { id: "communications", label: "Comunicados Oficiais", view: "pressCommunications", route: "/imprensa/comunicados" },
    { id: "club-search", label: "Busca de Clubes", view: "pressClubSearch", route: "/imprensa/busca" },
  ];

  const PRESS_PUBLIC_PROFILE_TABS = [
    { id: "overview", label: "Vis&atilde;o Geral" },
    { id: "squad", label: "Elenco" },
    { id: "staff", label: "Equipe" },
    { id: "stadium", label: "Est&aacute;dio" },
    { id: "training", label: "CT" },
    { id: "notes", label: "Notas &agrave; Imprensa" },
  ];

  const HORIZON_FILTERS = [
    { id: "city", label: "Cidade" },
    { id: "region", label: "Regi&atilde;o" },
    { id: "state", label: "Estado" },
    { id: "national", label: "Nacional" },
  ];

  const TRANSFER_FILTERS = [
    { id: "recent", label: "Recentes" },
    { id: "completed", label: "Transfer&ecirc;ncias conclu&iacute;das" },
    { id: "negotiating", label: "Negocia&ccedil;&otilde;es em andamento" },
    { id: "closed", label: "Negocia&ccedil;&otilde;es encerradas" },
    { id: "valuations", label: "Valoriza&ccedil;&otilde;es" },
    { id: "expiring", label: "Contratos expirando" },
    { id: "mine", label: "Meu clube" },
    { id: "followed", label: "Clubes acompanhados" },
  ];

  const COMMUNICATION_TYPES = [
    "Nota oficial",
    "Nota de esclarecimento",
    "Anuncio",
    "Promessa publica",
    "Posicionamento",
    "Resposta a imprensa",
    "Comunicado financeiro",
    "Comunicado esportivo",
    "Comunicado institucional",
    "Apresentacao de jogador",
    "Saida de profissional",
    "Inauguracao",
    "Anuncio de patrocinio",
    "Pedido de desculpas",
  ];

  const SQUAD_NAV_ITEMS = [
    { id: "squad", label: "Plantel", view: "squad", route: "/elenco/plantel" },
    { id: "training", label: "Treinamentos", view: "squadTraining", route: "/elenco/treinamentos" },
    { id: "youth", label: "Categoria de Base", view: "youth", route: "/elenco/base", condition: "youth" },
    { id: "medical", label: "Departamento M&eacute;dico", view: "squadMedical", route: "/elenco/medico", condition: "medical" },
    { id: "internal", label: "Jogos-Treino", view: "squadInternal", route: "/elenco/jogos-treino" },
  ];

  const MARKET_NAV_ITEMS = [
    { id: "players", label: "Jogadores", view: "marketPlayers", route: "/mercado/jogadores" },
    { id: "observation", label: "Observa&ccedil;&atilde;o", view: "marketObservation", route: "/mercado/observacao" },
    { id: "tryouts", label: "Peneiras", view: "marketTryouts", route: "/mercado/peneiras" },
    { id: "real-estate", label: "Mercado de Im&oacute;veis", view: "marketRealEstate", route: "/mercado/imoveis" },
    { id: "history", label: "Hist&oacute;rico", view: "marketHistory", route: "/mercado/historico" },
  ];

  const INSTALLATION_NAV_ITEMS = [
    { id: "stadium", label: "Est&aacute;dio", view: "stadium", route: "/escritorio/instalacoes/estadio", condition: "stadium" },
    { id: "training", label: "Centro de Treinamento", view: "training", route: "/escritorio/instalacoes/ct" },
    { id: "rooms", label: "Salas Administrativas", view: "rooms", route: "/escritorio/instalacoes/salas" },
    { id: "land", label: "Terrenos", view: "land", route: "/escritorio/instalacoes/terrenos" },
  ];

  const CALENDAR_NAV_ITEMS = [
    { id: "agenda", label: "Agenda", view: "calendarAgenda", route: "/calendario/agenda" },
    { id: "upcoming", label: "Pr&oacute;ximos Eventos", view: "calendarUpcoming", route: "/calendario/proximos" },
    { id: "completed", label: "Eventos Conclu&iacute;dos", view: "calendarCompleted", route: "/calendario/concluidos" },
    { id: "schedules", label: "Programa&ccedil;&otilde;es", view: "calendarSchedules", route: "/calendario/programacoes" },
    { id: "alerts", label: "Alertas", view: "calendarAlerts", route: "/calendario/alertas" },
  ];

  const STAFF_TABS = [
    { id: "overview", label: "Vis&atilde;o Geral", route: "/escritorio/funcionarios/visao-geral" },
    { id: "search", label: "Buscar Profissionais", route: "/escritorio/funcionarios/busca" },
    { id: "hiring", label: "Contrata&ccedil;&otilde;es", route: "/escritorio/funcionarios/contratacoes" },
    { id: "team", label: "Equipe Atual", route: "/escritorio/funcionarios/equipe" },
    { id: "development", label: "Desenvolvimento", route: "/escritorio/funcionarios/desenvolvimento" },
    { id: "org", label: "Estrutura Organizacional", route: "/escritorio/funcionarios/organograma" },
    { id: "history", label: "Hist&oacute;rico", route: "/escritorio/funcionarios/historico" },
  ];

  const VIEW_ROUTES = {
    overview: "/central",
    pressFeed: "/imprensa/arquibancada",
    pressClub: "/imprensa/meu-clube",
    pressMarket: "/imprensa/mercado-da-bola",
    pressHorizon: "/imprensa/jornal-horizonte",
    pressCommunications: "/imprensa/comunicados",
    pressClubSearch: "/imprensa/busca",
    pressPublicProfile: "/imprensa/clube",
    squad: "/elenco/plantel",
    squadTraining: "/elenco/treinamentos",
    youth: "/elenco/base",
    squadMedical: "/elenco/medico",
    squadInternal: "/elenco/jogos-treino",
    marketPlayers: "/mercado/jogadores",
    marketObservation: "/mercado/observacao",
    marketTryouts: "/mercado/peneiras",
    marketRealEstate: "/mercado/imoveis",
    marketHistory: "/mercado/historico",
    finances: "/escritorio/financas",
    property: "/escritorio/patrimonio",
    sponsorship: "/escritorio/patrocinios",
    reputation: "/escritorio/reputacao",
    installations: "/escritorio/instalacoes",
    training: "/escritorio/instalacoes/ct",
    rooms: "/escritorio/instalacoes/salas",
    stadium: "/escritorio/instalacoes/estadio",
    land: "/escritorio/instalacoes/terrenos",
    staff: "/escritorio/funcionarios",
    administration: "/escritorio/administracao",
    calendarAgenda: "/calendario/agenda",
    calendarUpcoming: "/calendario/proximos",
    calendarCompleted: "/calendario/concluidos",
    calendarSchedules: "/calendario/programacoes",
    calendarAlerts: "/calendario/alertas",
  };

  const STAFF_GROUPS = [
    { id: "coaches", label: "Treinadores" },
    { id: "technical", label: "Equipe tecnica" },
    { id: "medical", label: "Departamento medico" },
    { id: "administrative", label: "Equipe administrativa" },
    { id: "operations", label: "Operacoes e infraestrutura" },
  ];

  const STAFF_ROLE_CATALOG = [
    { id: "head-coach", label: "Treinador principal", group: "coaches", baseSalary: 8500, officeRequired: true, required: true, area: "Tatica" },
    { id: "assistant-coach", label: "Auxiliar tecnico", group: "coaches", baseSalary: 4200, officeRequired: true, required: true, area: "Lideranca" },
    { id: "youth-coach", label: "Treinador da categoria de base", group: "coaches", baseSalary: 3600, officeRequired: true, required: true, area: "Desenvolvimento de jovens" },
    { id: "goalkeeper-coach", label: "Treinador de goleiros", group: "coaches", baseSalary: 3300, officeRequired: true, required: false, area: "Tecnica" },
    { id: "individual-coach", label: "Treinador individual", group: "coaches", baseSalary: 3100, officeRequired: true, required: false, area: "Tecnica" },
    { id: "technical-coach", label: "Treinador tecnico", group: "coaches", baseSalary: 3400, officeRequired: true, required: false, area: "Tecnica" },
    { id: "tactical-coach", label: "Treinador tatico", group: "coaches", baseSalary: 3600, officeRequired: true, required: false, area: "Tatica" },
    { id: "fitness-coach", label: "Preparador fisico", group: "technical", baseSalary: 3900, officeRequired: true, required: true, area: "Fisica" },
    { id: "physiologist", label: "Fisiologista", group: "technical", baseSalary: 4300, officeRequired: true, required: false, area: "Fisica" },
    { id: "performance-analyst", label: "Analista de desempenho", group: "technical", baseSalary: 3800, officeRequired: true, required: true, area: "Analise" },
    { id: "opponent-analyst", label: "Analista de adversarios", group: "technical", baseSalary: 3500, officeRequired: true, required: false, area: "Analise" },
    { id: "technical-coordinator", label: "Coordenador tecnico", group: "technical", baseSalary: 6100, officeRequired: true, required: false, area: "Gestao" },
    { id: "football-director", label: "Diretor de futebol", group: "technical", baseSalary: 9200, officeRequired: true, required: true, area: "Gestao" },
    { id: "football-manager", label: "Gerente de futebol", group: "technical", baseSalary: 5600, officeRequired: true, required: false, area: "Gestao" },
    { id: "scout", label: "Olheiro", group: "technical", baseSalary: 2800, officeRequired: true, required: true, area: "Observacao" },
    { id: "chief-scout", label: "Chefe de olheiros", group: "technical", baseSalary: 5200, officeRequired: true, required: false, area: "Observacao" },
    { id: "doctor", label: "Medico", group: "medical", baseSalary: 7600, officeRequired: false, required: true, area: "Medica" },
    { id: "physiotherapist", label: "Fisioterapeuta", group: "medical", baseSalary: 4300, officeRequired: false, required: true, area: "Medica" },
    { id: "masseur", label: "Massagista", group: "medical", baseSalary: 2500, officeRequired: false, required: false, area: "Medica" },
    { id: "nutritionist", label: "Nutricionista", group: "medical", baseSalary: 3600, officeRequired: false, required: false, area: "Medica" },
    { id: "psychologist", label: "Psicologo", group: "medical", baseSalary: 3900, officeRequired: false, required: false, area: "Lideranca" },
    { id: "rehab-coach", label: "Preparador de reabilitacao", group: "medical", baseSalary: 3700, officeRequired: false, required: false, area: "Medica" },
    { id: "financial-director", label: "Diretor financeiro", group: "administrative", baseSalary: 6900, officeRequired: true, required: true, area: "Financas" },
    { id: "accountant", label: "Contador", group: "administrative", baseSalary: 3600, officeRequired: true, required: true, area: "Financas" },
    { id: "lawyer", label: "Advogado", group: "administrative", baseSalary: 5200, officeRequired: true, required: true, area: "Negociacao" },
    { id: "admin-manager", label: "Gerente administrativo", group: "administrative", baseSalary: 4700, officeRequired: true, required: true, area: "Gestao" },
    { id: "marketing-manager", label: "Responsavel por marketing", group: "administrative", baseSalary: 4100, officeRequired: true, required: true, area: "Marketing" },
    { id: "sponsor-manager", label: "Responsavel por patrocinios", group: "administrative", baseSalary: 4300, officeRequired: true, required: true, area: "Negociacao" },
    { id: "press-officer", label: "Assessor de imprensa", group: "administrative", baseSalary: 3300, officeRequired: true, required: false, area: "Marketing" },
    { id: "property-manager", label: "Gestor de patrimonio", group: "administrative", baseSalary: 3900, officeRequired: true, required: false, area: "Gestao" },
    { id: "admin-staff", label: "Funcionario administrativo", group: "administrative", baseSalary: 2100, officeRequired: true, required: true, area: "Gestao" },
    { id: "groundskeeper", label: "Responsavel pelo gramado", group: "operations", baseSalary: 2500, officeRequired: false, required: false, area: "Gestao" },
    { id: "maintenance-staff", label: "Funcionario de manutencao", group: "operations", baseSalary: 2200, officeRequired: false, required: true, area: "Gestao" },
    { id: "security", label: "Seguranca", group: "operations", baseSalary: 2100, officeRequired: false, required: false, area: "Lideranca" },
    { id: "kitman", label: "Roupeiro", group: "operations", baseSalary: 2100, officeRequired: false, required: false, area: "Gestao" },
    { id: "cook", label: "Cozinheiro", group: "operations", baseSalary: 2300, officeRequired: false, required: false, area: "Gestao" },
    { id: "lodging-manager", label: "Responsavel pelo alojamento", group: "operations", baseSalary: 2900, officeRequired: false, required: false, area: "Gestao" },
    { id: "facility-manager", label: "Gerente de instalacoes", group: "operations", baseSalary: 4300, officeRequired: false, required: false, area: "Gestao" },
  ];

  const STAFF_FIRST_NAMES = ["Amanda", "Bruno", "Camila", "Diego", "Eduardo", "Fernanda", "Gustavo", "Helena", "Marcos", "Renata", "Samuel", "Tatiane"];
  const STAFF_LAST_NAMES = ["Almeida", "Barros", "Campos", "Dias", "Freitas", "Lopes", "Martins", "Nogueira", "Queiroz", "Rezende", "Teixeira", "Vieira"];
  const STAFF_CITIES = ["Campinas", "Santos", "Ribeirao Preto", "Sorocaba", "Londrina", "Caxias do Sul", "Contagem", "Niteroi"];

  const DEMO_CLUB_BLUEPRINTS = [
    {
      id: "atletico-do-vale",
      fullName: "Atletico do Vale Futebol Clube",
      shortName: "Atletico do Vale",
      acronym: "ADV",
      city: "Campinas",
      state: "SP",
      legalModel: "association",
      mascot: "Gaviao",
      colors: { primary: "#1f6feb", secondary: "#ffffff", accent: "#d8a21a" },
      shieldShape: "shield",
      uniformPattern: "stripes",
      foundedAt: "2026-06-12T14:00:00.000Z",
      publicReputation: { institutional: 2.4, financial: 2.1, sporting: 1.9 },
      stadium: { name: "Arena Vale Azul", capacity: 8720, city: "Campinas", ownership: "Proprio", modules: "2 modulos simples", level: "Basico" },
      trainingCenter: { name: "CT Vale Azul", city: "Campinas", facilities: ["Campo de treinamento: Basico", "Academia: Simples", "Categoria de base: Moderna"] },
      squad: [
        { name: "Lucas Martins", age: 16, position: "ATA" },
        { name: "Andre Lima", age: 22, position: "VOL" },
        { name: "Mateus Rocha", age: 24, position: "ZAG" },
      ],
      staff: [
        { name: "Carlos Mendes", role: "treinador principal" },
        { name: "Ana Souza", role: "diretora financeira" },
      ],
    },
    {
      id: "uniao-central",
      fullName: "Uniao Central Esporte Clube",
      shortName: "Uniao Central",
      acronym: "UCE",
      city: "Sorocaba",
      state: "SP",
      legalModel: "saf",
      mascot: "Trem",
      colors: { primary: "#0b7a53", secondary: "#f7f6ef", accent: "#cf5f25" },
      shieldShape: "round",
      uniformPattern: "diagonal",
      foundedAt: "2026-05-04T18:00:00.000Z",
      publicReputation: { institutional: 3.1, financial: 3.4, sporting: 2.6 },
      stadium: { name: "Municipal Central", capacity: 12600, city: "Sorocaba", ownership: "Alugado", modules: "Municipal", level: "Basico" },
      trainingCenter: { name: "Nucleo Central", city: "Sorocaba", facilities: ["Campo de treinamento: Moderno", "Alojamento: Simples"] },
      squad: [
        { name: "Joao Silva", age: 20, position: "MEI" },
        { name: "Rafael Dantas", age: 25, position: "GOL" },
      ],
      staff: [
        { name: "Paulo Rocha", role: "medico" },
        { name: "Bianca Torres", role: "gerente administrativa" },
      ],
    },
    {
      id: "aurora-litoranea",
      fullName: "Aurora Litoranea SAF",
      shortName: "Aurora Litoranea",
      acronym: "AUR",
      city: "Santos",
      state: "SP",
      legalModel: "saf",
      mascot: "Farol",
      colors: { primary: "#007c89", secondary: "#ffffff", accent: "#d8a21a" },
      shieldShape: "diamond",
      uniformPattern: "hoops",
      foundedAt: "2026-04-19T12:30:00.000Z",
      publicReputation: { institutional: 4.2, financial: 3.8, sporting: 3.0 },
      stadium: { name: "Estadio do Farol", capacity: 24889, city: "Santos", ownership: "Proprio", modules: "1 modulo moderno", level: "Moderno" },
      trainingCenter: { name: "CT Praia Clara", city: "Santos", facilities: ["Campo de treinamento: Moderno", "Academia: Moderna", "Centro Clinico: Basico"] },
      squad: [
        { name: "Felipe Barros", age: 23, position: "PE" },
        { name: "Nicolas Moura", age: 19, position: "LD" },
      ],
      staff: [
        { name: "Renata Prado", role: "responsavel por patrocinios" },
        { name: "Gilberto Nunes", role: "treinador principal" },
      ],
    },
  ];

  const Clock = {
    now() {
      return Date.now();
    },
    iso() {
      return new Date(this.now()).toISOString();
    },
  };

  let state = loadState();
  const initialRoute = getInitialRouteSelection();
  let currentView = state.club ? initialRoute.view : "setup";
  let currentStaffTab = initialRoute.staffTab || state.staff?.activeTab || "overview";
  let currentInstallationTab = initialRoute.installationTab || "stadium";
  if (initialRoute.profileSlug && state.press) state.press.profileSlug = initialRoute.profileSlug;

  function createEmptyState() {
    return {
      version: 2,
      club: null,
      finance: { cash: 0 },
      donations: { confirmed: false, acceptedIds: [] },
      municipalGrant: {
        status: "not_requested",
        requestedAt: null,
        acceptedAt: null,
        deadlineAt: null,
        debt: 0,
        debtStartedAt: null,
        lastInterestAt: null,
        installmentPlan: null,
        financialBlocked: false,
      },
      reputations: {
        institutional: { value: 1, history: [] },
        financial: { value: 1, history: [] },
        sporting: { value: 0.5, history: [] },
      },
      facilities: {
        municipalField: null,
        adminRooms: [],
        lands: [],
        trainingCenter: { facilities: [] },
        stadium: { modules: [], rentals: [] },
      },
      sponsorships: { quotas: [], proposals: [], contracts: [] },
      press: {
        communications: [],
        horizonFilter: "city",
        transferFilter: "recent",
        clubSearch: "",
        profileSlug: null,
        profileTab: "overview",
        followedClubIds: [],
      },
      staff: {
        market: [],
        proposals: [],
        employees: [],
        development: [],
        history: [],
        filters: {},
        draftProfessionalId: null,
        activeTab: "overview",
      },
      constructions: [],
      promises: [],
      players: { squad: [], tryoutFindings: [], youth: [] },
      youthAcademy: { coaches: 20, scouts: 20, methodology: 20 },
      events: [],
      offlineReport: null,
      lastUpdateAt: null,
    };
  }

  function normalizeState(raw) {
    const base = createEmptyState();
    const merged = { ...base, ...raw };
    merged.version = base.version;
    merged.finance = { ...base.finance, ...(raw.finance || {}) };
    merged.donations = { ...base.donations, ...(raw.donations || {}) };
    merged.municipalGrant = { ...base.municipalGrant, ...(raw.municipalGrant || {}) };
    merged.reputations = {
      institutional: { ...base.reputations.institutional, ...((raw.reputations || {}).institutional || {}) },
      financial: { ...base.reputations.financial, ...((raw.reputations || {}).financial || {}) },
      sporting: { ...base.reputations.sporting, ...((raw.reputations || {}).sporting || {}) },
    };
    merged.facilities = {
      municipalField: (raw.facilities || {}).municipalField || null,
      adminRooms: ((raw.facilities || {}).adminRooms || []),
      lands: ((raw.facilities || {}).lands || []),
      trainingCenter: { facilities: (((raw.facilities || {}).trainingCenter || {}).facilities || []) },
      stadium: {
        modules: (((raw.facilities || {}).stadium || {}).modules || []),
        rentals: (((raw.facilities || {}).stadium || {}).rentals || []),
      },
    };
    merged.sponsorships = {
      quotas: ((raw.sponsorships || {}).quotas || []),
      proposals: ((raw.sponsorships || {}).proposals || []),
      contracts: ((raw.sponsorships || {}).contracts || []),
    };
    merged.press = {
      ...base.press,
      ...(raw.press || {}),
      communications: ((raw.press || {}).communications || []),
      followedClubIds: ((raw.press || {}).followedClubIds || []),
      horizonFilter: ((raw.press || {}).horizonFilter || "city"),
      transferFilter: ((raw.press || {}).transferFilter || "recent"),
      clubSearch: ((raw.press || {}).clubSearch || ""),
      profileSlug: ((raw.press || {}).profileSlug || null),
      profileTab: ((raw.press || {}).profileTab || "overview"),
    };
    merged.staff = {
      ...base.staff,
      ...(raw.staff || {}),
      market: ((raw.staff || {}).market || []),
      proposals: ((raw.staff || {}).proposals || []),
      employees: ((raw.staff || {}).employees || []).map((employee) => ({
        ...employee,
        nextSalaryAt: employee.nextSalaryAt || addMonths(employee.hiredAt || Clock.iso(), 1),
        status: employee.status || "active",
      })),
      development: ((raw.staff || {}).development || []),
      history: ((raw.staff || {}).history || []),
      filters: ((raw.staff || {}).filters || {}),
      activeTab: ((raw.staff || {}).activeTab || "overview"),
    };
    merged.constructions = raw.constructions || [];
    merged.promises = raw.promises || [];
    merged.players = {
      squad: ((raw.players || {}).squad || []),
      tryoutFindings: ((raw.players || {}).tryoutFindings || []),
      youth: ((raw.players || {}).youth || []),
    };
    merged.youthAcademy = { ...base.youthAcademy, ...(raw.youthAcademy || {}) };
    merged.events = raw.events || [];
    if (merged.club && !merged.club.hashtag) merged.club.hashtag = makeClubHashtag(merged.club.shortName || merged.club.acronym || "clube");
    if (merged.club && merged.staff.market.length === 0) seedStaffMarket(merged);
    seedReputationHistory(merged);
    return merged;
  }

  function seedReputationHistory(target) {
    const foundedAt = target.club?.foundedAt || Clock.iso();
    Object.entries(target.reputations).forEach(([key, rep]) => {
      if (!rep.history || rep.history.length === 0) {
        rep.history = [{ date: foundedAt, value: rep.value, reason: "Valor inicial do clube." }];
      }
    });
  }

  function seedStaffMarket(target) {
    target.staff.market = STAFF_ROLE_CATALOG.map((role, index) => createMarketProfessional(role, target.club, index));
    target.staff.history.unshift({
      id: uid("staff-history"),
      professionalName: "Mercado de profissionais",
      event: "Lista inicial simulada",
      date: Clock.iso(),
      financialImpact: 0,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
  }

  function createMarketProfessional(role, club, index) {
    const experience = randomInt(1, 22);
    const reputation = clamp(0.45 + experience * 0.13 + randomInt(0, 24) / 10, 0.3, 5.6);
    const levelSeed = clamp(22 + experience * 2 + randomInt(0, 35), 18, 92);
    const salaryFactor = 0.72 + reputation * 0.16 + experience * 0.012;
    const preference = ["association", "saf", "neutral"][(index + randomInt(0, 2)) % 3];
    const city = index % 5 === 0 && club?.city ? club.city : STAFF_CITIES[randomInt(0, STAFF_CITIES.length - 1)];
    return {
      id: uid("professional"),
      name: `${STAFF_FIRST_NAMES[randomInt(0, STAFF_FIRST_NAMES.length - 1)]} ${STAFF_LAST_NAMES[randomInt(0, STAFF_LAST_NAMES.length - 1)]}`,
      age: randomInt(25, 62),
      nationality: "Brasil",
      city,
      state: index % 4 === 0 && club?.state ? club.state : ["SP", "RJ", "MG", "PR", "RS"][randomInt(0, 4)],
      primaryRoleId: role.id,
      primaryRoleLabel: role.label,
      groupId: role.group,
      groupLabel: staffGroupLabel(role.group),
      secondaryRoles: pickSecondaryRoles(role),
      attributes: createStaffAttributes(role, levelSeed),
      experience,
      reputation,
      desiredSalary: Math.round(role.baseSalary * salaryFactor),
      desiredMonths: [6, 12, 18, 24, 36][randomInt(0, 4)],
      demands: createStaffDemands(role, reputation),
      availability: "Disponivel",
      legalPreference: preference,
      status: "available",
      history: [`${experience} ano(s) de experiencia em ${staffGroupLabel(role.group)}.`],
    };
  }

  function pickSecondaryRoles(role) {
    const sameGroup = STAFF_ROLE_CATALOG.filter((item) => item.group === role.group && item.id !== role.id);
    return sameGroup.slice(0, 2).map((item) => item.label);
  }

  function createStaffAttributes(role, seed) {
    const attributes = {
      technical: clamp(seed + randomInt(-12, 12), 1, 100),
      tactical: clamp(seed + randomInt(-12, 12), 1, 100),
      fitness: clamp(seed + randomInt(-12, 12), 1, 100),
      medical: clamp(seed + randomInt(-12, 12), 1, 100),
      analysis: clamp(seed + randomInt(-12, 12), 1, 100),
      leadership: clamp(seed + randomInt(-12, 12), 1, 100),
      negotiation: clamp(seed + randomInt(-12, 12), 1, 100),
      finances: clamp(seed + randomInt(-12, 12), 1, 100),
      marketing: clamp(seed + randomInt(-12, 12), 1, 100),
      management: clamp(seed + randomInt(-12, 12), 1, 100),
      scouting: clamp(seed + randomInt(-12, 12), 1, 100),
      youthDevelopment: clamp(seed + randomInt(-12, 12), 1, 100),
    };

    const focus = {
      coaches: ["technical", "tactical", "leadership", "youthDevelopment"],
      technical: ["fitness", "analysis", "management", "scouting"],
      medical: ["medical", "fitness", "leadership"],
      administrative: ["finances", "marketing", "negotiation", "management"],
      operations: ["management", "leadership", "fitness"],
    }[role.group] || [];

    focus.forEach((key) => {
      attributes[key] = clamp(attributes[key] + 10, 1, 100);
    });
    return attributes;
  }

  function createStaffDemands(role, reputation) {
    const demands = [];
    if (reputation > 3.5) demands.push("estrutura minima adequada");
    if (role.officeRequired) demands.push("sala administrativa disponivel");
    if (role.group === "coaches") demands.push("projeto esportivo claro");
    if (role.group === "medical") demands.push("instalacoes medicas compativeis");
    if (role.group === "operations") demands.push("responsabilidades bem definidas");
    return demands;
  }

  function getInitialRouteSelection() {
    const location = globalThis.window?.location;
    const route = (location?.hash || "").replace(/^#/, "") || location?.pathname || "";
    const publicProfileMatch = route.match(/^\/imprensa\/clube\/([^/]+)/);
    if (publicProfileMatch) return { view: "pressPublicProfile", profileSlug: publicProfileMatch[1], staffTab: "overview" };
    const staffRoute = STAFF_TABS.find((tab) => route === tab.route);
    if (route === "/escritorio/funcionarios") return { view: "staff", staffTab: "overview" };
    if (staffRoute) return { view: "staff", staffTab: staffRoute.id };
    const installationRoute = INSTALLATION_NAV_ITEMS.find((item) => route === item.route);
    if (installationRoute) return { view: "installations", staffTab: "overview", installationTab: installationRoute.id };
    const routePools = [
      NAV_ITEMS,
      PRESS_NAV_ITEMS,
      SQUAD_NAV_ITEMS,
      MARKET_NAV_ITEMS,
      OFFICE_NAV_ITEMS,
      CALENDAR_NAV_ITEMS,
    ];
    for (const pool of routePools) {
      const found = pool.find((item) => route === item.route);
      if (found) return { view: found.view, staffTab: "overview" };
    }
    const legacyRouteMap = {
      "/": "overview",
      "/index.html": "overview",
      "/central": "overview",
      "/imprensa/feed": "pressFeed",
      "/imprensa/mercado": "pressMarket",
      "/imprensa/cidade": "pressHorizon",
      "/imprensa/regiao": "pressHorizon",
      "/imprensa/nacional": "pressHorizon",
      "/escritorio": "finances",
      "/imprensa": "pressFeed",
      "/elenco": "squad",
      "/mercado": "marketPlayers",
      "/calendario": "calendarAgenda",
    };
    if (legacyRouteMap[route]) return { view: legacyRouteMap[route], staffTab: "overview" };
    return { view: "overview", staffTab: "overview" };
  }

  function setPrototypeRoute(route) {
    if (!globalThis.window?.location || !route) return;
    const hash = `#${route}`;
    if (globalThis.window.location.hash !== hash) {
      globalThis.window.location.hash = hash;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : createEmptyState();
    } catch (error) {
      console.warn("Falha ao carregar estado local", error);
      return createEmptyState();
    }
  }

  function saveState() {
    state.lastUpdateAt = Clock.iso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function uid(prefix = "id") {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || "clube";
  }

  function makeClubHashtag(value) {
    return `#${slugify(value).replace(/-/g, "")}`;
  }

  function money(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
  }

  function number(value, digits = 0) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function toDateTimeLocal(value) {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * MS_MINUTE);
    return local.toISOString().slice(0, 16);
  }

  function addDays(value, days) {
    return new Date(new Date(value).getTime() + days * MS_DAY).toISOString();
  }

  function addMinutes(value, minutes) {
    return new Date(new Date(value).getTime() + minutes * MS_MINUTE).toISOString();
  }

  function addMonths(value, months = 1) {
    const date = new Date(value);
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  }

  function daysBetween(start, end) {
    return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / MS_DAY);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value || 0)));
  }

  function toNumber(value) {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function remainingTime(value) {
    const diff = new Date(value).getTime() - Clock.now();
    if (diff <= 0) return "Pronto para concluir";
    const days = Math.floor(diff / MS_DAY);
    const hours = Math.floor((diff % MS_DAY) / (60 * MS_MINUTE));
    const minutes = Math.floor((diff % (60 * MS_MINUTE)) / MS_MINUTE);
    if (days > 0) return `${days}d ${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  }

  function getLevelLabel(levelId) {
    return LEVELS.find((level) => level.id === levelId)?.label || "Simples";
  }

  function reputationLevel(value) {
    if (value < 1) return { label: "Pessima", tone: "danger" };
    if (value < 2) return { label: "Ruim", tone: "warn" };
    if (value < 3) return { label: "Media", tone: "info" };
    if (value < 5) return { label: "Boa", tone: "good" };
    return { label: "Excelente", tone: "good" };
  }

  function addEvent({ type, title, description, financialImpact = 0, reputationImpact = null, date = Clock.iso() }) {
    state.events.unshift({
      id: uid("event"),
      type,
      title,
      description,
      date,
      financialImpact,
      reputationImpact,
    });
    state.events = state.events.slice(0, 250);
  }

  function addCash(amount, title, description, type = "finance") {
    state.finance.cash += amount;
    addEvent({ type, title, description, financialImpact: amount });
  }

  function spendCash(amount, title, description, type = "finance") {
    if (state.finance.cash < amount) {
      toast("Caixa insuficiente para concluir esta acao.");
      return false;
    }
    state.finance.cash -= amount;
    addEvent({ type, title, description, financialImpact: -amount });
    return true;
  }

  function applyReputationChange(key, delta, reason, date = Clock.iso()) {
    const rep = state.reputations[key];
    if (!rep) return;
    rep.value = clamp(rep.value + delta, 0, 10);
    rep.history.unshift({ date, value: rep.value, reason });
  }

  function getReputationAverage() {
    const reps = state.reputations;
    return (reps.institutional.value + reps.financial.value + reps.sporting.value) / 3;
  }

  function processWorldProgress(initialLoad = false) {
    if (!state.club) return [];
    const changes = [];
    const nowMs = Clock.now();

    state.constructions.forEach((construction) => {
      if (construction.status === "in_progress" && new Date(construction.endAt).getTime() <= nowMs) {
        completeConstruction(construction, changes);
      }
    });

    processRecurringCharges(changes);
    processSponsorshipExpirations(changes);
    processStaffEvents(changes);
    processMunicipalGrantClock(changes);

    if (initialLoad && changes.length > 0) {
      state.offlineReport = {
        seen: false,
        from: state.lastUpdateAt,
        to: Clock.iso(),
        items: changes.slice(0, 8),
      };
    }

    return changes;
  }

  function completeConstruction(construction, changes) {
    construction.status = "completed";
    construction.completedAt = construction.endAt;
    construction.finalized = true;

    if (construction.kind === "admin-room") {
      const option = ADMIN_ROOM_OPTIONS.find((item) => item.id === construction.payload.optionId);
      const mode = construction.payload.mode;
      const roomCost = mode === "purchase" ? option.purchase : option.rent;
      state.facilities.adminRooms.push({
        id: uid("room"),
        name: option.label,
        mode,
        location: option.id,
        purchaseValue: option.purchase,
        monthlyRent: mode === "rent" ? option.rent : 0,
        monthlyMaintenance: option.purchase * 0.015,
        capacity: 6,
        status: "active",
        acquiredAt: construction.endAt,
        nextChargeAt: addMonths(construction.endAt, 1),
      });
    }

    if (construction.kind === "ct-facility") {
      state.facilities.trainingCenter.facilities.push({
        id: uid("ct"),
        ...construction.payload,
        status: "active",
        acquiredAt: construction.endAt,
        nextChargeAt: addMonths(construction.endAt, 1),
      });
    }

    if (construction.kind === "stadium-module") {
      const payload = { ...construction.payload };
      if (payload.reformOfId) {
        const oldModule = state.facilities.stadium.modules.find((module) => module.id === payload.reformOfId);
        if (oldModule) {
          oldModule.status = "replaced";
          oldModule.replacedAt = construction.endAt;
        }
      }
      state.facilities.stadium.modules.push({
        id: uid("stadium"),
        ...payload,
        status: "active",
        acquiredAt: construction.endAt,
        nextChargeAt: addMonths(construction.endAt, 1),
      });
    }

    if (construction.kind === "tryout") {
      const generated = generatePlayers(5, "peneira");
      state.players.tryoutFindings.push(...generated);
      construction.payload.generatedIds = generated.map((player) => player.id);
    }

    const title = `${construction.title} concluida`;
    addEvent({
      type: construction.kind,
      title,
      description: "Evento concluido automaticamente pela comparacao entre a data salva e o horario atual.",
      date: construction.endAt,
    });
    changes.push(title);
  }

  function processRecurringCharges(changes) {
    const charge = (item, label, cost) => {
      if (!item || !item.nextChargeAt || cost <= 0) return;
      let guard = 0;
      while (new Date(item.nextChargeAt).getTime() <= Clock.now() && guard < 36) {
        state.finance.cash -= cost;
        addEvent({
          type: "monthly-charge",
          title: `Cobranca mensal: ${label}`,
          description: `Despesa recorrente registrada em ${formatDate(item.nextChargeAt)}.`,
          financialImpact: -cost,
          date: item.nextChargeAt,
        });
        changes.push(`Cobranca mensal: ${label}`);
        item.nextChargeAt = addMonths(item.nextChargeAt, 1);
        guard += 1;
      }
    };

    if (state.facilities.municipalField?.active) {
      charge(state.facilities.municipalField, "Campo municipal", 891.72);
    }

    state.facilities.adminRooms.forEach((room) => {
      if (room.status === "active") {
        charge(room, `Sala administrativa - ${room.name}`, room.monthlyRent + room.monthlyMaintenance);
      }
    });

    state.facilities.lands.forEach((land) => {
      if (land.status === "active") {
        charge(land, `Terreno - ${land.zoneLabel}`, land.monthlyMaintenance);
      }
    });

    state.facilities.trainingCenter.facilities.forEach((facility) => {
      if (facility.status === "active") {
        charge(facility, `CT - ${facility.label}`, facility.monthlyMaintenance);
      }
    });

    state.facilities.stadium.modules.forEach((module) => {
      if (module.status === "active") {
        charge(module, `Estadio - modulo ${number(module.seats)} lugares`, module.monthlyMaintenance);
      }
    });

    state.staff.employees.forEach((employee) => {
      if (employee.status !== "active" || !employee.nextSalaryAt) return;
      let guard = 0;
      while (new Date(employee.nextSalaryAt).getTime() <= Clock.now() && guard < 36) {
        state.finance.cash -= employee.salary;
        addEvent({
          type: "staff-payroll",
          title: `Salario pago: ${employee.name}`,
          description: `${employee.roleLabel} recebeu salario mensal.`,
          financialImpact: -employee.salary,
          date: employee.nextSalaryAt,
        });
        addStaffHistory({
          professionalName: employee.name,
          event: "Pagamento mensal de salario",
          financialImpact: -employee.salary,
          sportingImpact: 0,
          institutionalImpact: 0,
          date: employee.nextSalaryAt,
        });
        changes.push(`Salario pago: ${employee.name}`);
        employee.nextSalaryAt = addMonths(employee.nextSalaryAt, 1);
        guard += 1;
      }
    });
  }

  function processSponsorshipExpirations(changes) {
    const nowMs = Clock.now();
    state.sponsorships.proposals.forEach((proposal) => {
      if (proposal.status === "offered" && new Date(proposal.expiresAt).getTime() <= nowMs) {
        proposal.status = "expired";
        const title = `Proposta expirada: ${proposal.company}`;
        addEvent({
          type: "sponsorship",
          title,
          description: `A proposta para ${proposal.quotaName} expirou sem aceite.`,
          date: proposal.expiresAt,
        });
        changes.push(title);
      }
    });

    state.sponsorships.contracts.forEach((contract) => {
      if (contract.status === "active" && new Date(contract.endAt).getTime() <= nowMs) {
        contract.status = "expired";
        const title = `Contrato encerrado: ${contract.company}`;
        addEvent({
          type: "sponsorship",
          title,
          description: `Contrato de patrocinio encerrado para ${contract.quotaName}.`,
          date: contract.endAt,
        });
        changes.push(title);
      }
    });
  }

  function processStaffEvents(changes) {
    const nowMs = Clock.now();
    state.staff.proposals.forEach((proposal) => {
      if (proposal.status === "waiting" && new Date(proposal.expiresAt).getTime() <= nowMs) {
        const result = evaluateStaffProposal(proposal.candidateSnapshot, proposal.offer, true);
        if (result.status === "accepted") {
          proposal.answer = "Aceitou apos avaliar o projeto.";
          hireStaffFromProposal(proposal, result);
        } else {
          proposal.status = "rejected";
          proposal.answer = result.reason;
          addStaffHistory({
            professionalName: proposal.professionalName,
            event: "Proposta recusada apos prazo de avaliacao",
            financialImpact: 0,
            sportingImpact: 0,
            institutionalImpact: 0,
          });
        }
        changes.push(`Resposta de profissional: ${proposal.professionalName}`);
      }
    });

    state.staff.development.forEach((development) => {
      if (development.status === "in_progress" && new Date(development.endAt).getTime() <= nowMs) {
        development.status = "completed";
        development.completedAt = development.endAt;
        const employee = state.staff.employees.find((item) => item.id === development.employeeId);
        if (employee) {
          employee.attributes[development.areaKey] = clamp((employee.attributes[development.areaKey] || 0) + development.gain, 0, 100);
          employee.performance = clamp(employee.performance + 2, 0, 100);
          employee.moral = clamp(employee.moral + 1, 0, 100);
          employee.evolution += development.gain;
          addStaffHistory({
            professionalName: employee.name,
            event: `Curso concluido em ${development.areaLabel}`,
            financialImpact: 0,
            sportingImpact: development.gain,
            institutionalImpact: 0,
            date: development.endAt,
          });
          addEvent({
            type: "staff-development",
            title: "Curso de funcionario concluido",
            description: `${employee.name} evoluiu em ${development.areaLabel}.`,
            date: development.endAt,
          });
          changes.push(`Curso concluido: ${employee.name}`);
        }
      }
    });

    state.staff.employees.forEach((employee) => {
      if (employee.status === "active" && new Date(employee.contractEndAt).getTime() <= nowMs) {
        employee.status = "expired";
        addStaffHistory({
          professionalName: employee.name,
          event: "Contrato encerrado",
          financialImpact: 0,
          sportingImpact: 0,
          institutionalImpact: 0,
          date: employee.contractEndAt,
        });
        addEvent({
          type: "staff",
          title: "Contrato de funcionario encerrado",
          description: `${employee.name} encerrou contrato como ${employee.roleLabel}.`,
          date: employee.contractEndAt,
        });
        changes.push(`Contrato encerrado: ${employee.name}`);
      }
    });
  }

  function processMunicipalGrantClock(changes) {
    const grant = state.municipalGrant;
    if (grant.status === "accepted" && grant.deadlineAt && new Date(grant.deadlineAt).getTime() <= Clock.now()) {
      grant.status = "review_due";
      const title = "Compromisso da verba municipal em revisao";
      addEvent({
        type: "municipal-grant",
        title,
        description: "O prazo simulado terminou. Registre cumprimento ou descumprimento.",
        date: grant.deadlineAt,
      });
      changes.push(title);
    }

    if ((grant.status === "debt_active" || grant.status === "installment") && grant.debt > 0 && grant.lastInterestAt) {
      const fullDays = Math.floor((Clock.now() - new Date(grant.lastInterestAt).getTime()) / MS_DAY);
      if (fullDays > 0) {
        grant.debt = grant.debt * Math.pow(1.05, fullDays);
        grant.lastInterestAt = addDays(grant.lastInterestAt, fullDays);
        const title = "Juros da divida municipal atualizados";
        addEvent({
          type: "debt",
          title,
          description: `Foram aplicados ${fullDays} dia(s) de juros de 5% ao dia.`,
          financialImpact: 0,
        });
        changes.push(title);
      }
      if (grant.debtStartedAt && daysBetween(grant.debtStartedAt, Clock.iso()) >= 21) {
        grant.financialBlocked = true;
      }
    }
  }

  function startConstruction({ kind, title, cost, buildUntil, payload }) {
    if (!spendCash(cost, title, "Valor reservado para inicio da obra ou aquisicao.", kind)) return false;
    state.constructions.push({
      id: uid("work"),
      kind,
      title,
      cost,
      status: "in_progress",
      startAt: Clock.iso(),
      endAt: buildUntil,
      payload,
    });
    addEvent({
      type: kind,
      title: `${title} iniciada`,
      description: `Previsao de conclusao em ${formatDate(buildUntil)}.`,
    });
    return true;
  }

  function getActiveConstructions() {
    return state.constructions.filter((construction) => construction.status === "in_progress");
  }

  function getPropertyValue() {
    const ownedRooms = state.facilities.adminRooms
      .filter((room) => room.mode === "purchase" && room.status === "active")
      .reduce((sum, room) => sum + room.purchaseValue, 0);
    const lands = state.facilities.lands.reduce((sum, land) => sum + land.price, 0);
    const ct = state.facilities.trainingCenter.facilities.reduce((sum, facility) => sum + facility.cost, 0);
    const stadium = state.facilities.stadium.modules
      .filter((module) => module.status === "active")
      .reduce((sum, module) => sum + module.cost, 0);
    return ownedRooms + lands + ct + stadium;
  }

  function getMonthlyExpenses() {
    const rows = [];
    if (state.facilities.municipalField?.active) {
      rows.push({
        label: "Campo municipal",
        type: "Uso publico",
        amount: 891.72,
        nextChargeAt: state.facilities.municipalField.nextChargeAt,
      });
    }

    state.facilities.adminRooms.forEach((room) => {
      if (room.status !== "active") return;
      rows.push({
        label: `Sala administrativa - ${room.name}`,
        type: room.mode === "rent" ? "Aluguel + manutencao" : "Manutencao",
        amount: room.monthlyRent + room.monthlyMaintenance,
        nextChargeAt: room.nextChargeAt,
      });
    });

    state.facilities.lands.forEach((land) => {
      rows.push({
        label: `Terreno - ${land.zoneLabel}`,
        type: "Manutencao",
        amount: land.monthlyMaintenance,
        nextChargeAt: land.nextChargeAt,
      });
    });

    state.facilities.trainingCenter.facilities.forEach((facility) => {
      if (facility.status !== "active") return;
      rows.push({
        label: `CT - ${facility.label}`,
        type: "Manutencao",
        amount: facility.monthlyMaintenance,
        nextChargeAt: facility.nextChargeAt,
      });
    });

    state.facilities.stadium.modules.forEach((module) => {
      if (module.status !== "active") return;
      rows.push({
        label: `Estadio - ${number(module.seats)} lugares`,
        type: "Manutencao",
        amount: module.monthlyMaintenance,
        nextChargeAt: module.nextChargeAt,
      });
    });

    const payroll = getStaffPayrollTotal();
    if (payroll > 0) {
      rows.push({
        label: "Folha de funcionarios",
        type: "Salarios",
        amount: payroll,
        nextChargeAt: getNextStaffPayrollAt(),
      });
    }

    return rows;
  }

  function getMonthlyExpenseTotal() {
    return getMonthlyExpenses().reduce((sum, row) => sum + row.amount, 0);
  }

  function getActiveStaff() {
    return state.staff.employees.filter((employee) => employee.status === "active");
  }

  function getStaffPayrollTotal() {
    return getActiveStaff().reduce((sum, employee) => sum + employee.salary, 0);
  }

  function getNextStaffPayrollAt() {
    const dates = getActiveStaff()
      .map((employee) => employee.nextSalaryAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b));
    return dates[0] || null;
  }

  function getRecentRevenue(days = 30) {
    const since = Clock.now() - days * MS_DAY;
    return state.events
      .filter((event) => new Date(event.date).getTime() >= since && event.financialImpact > 0)
      .reduce((sum, event) => sum + event.financialImpact, 0);
  }

  function getRecentExpense(days = 30) {
    const since = Clock.now() - days * MS_DAY;
    return Math.abs(state.events
      .filter((event) => new Date(event.date).getTime() >= since && event.financialImpact < 0)
      .reduce((sum, event) => sum + event.financialImpact, 0));
  }

  function getUpcomingEventItems() {
    const upcoming = [];
    getActiveConstructions().forEach((work) => upcoming.push({ title: work.title, date: work.endAt, type: "Conclusao" }));
    getMonthlyExpenses().forEach((expense) => upcoming.push({ title: expense.label, date: expense.nextChargeAt, type: "Cobranca" }));
    state.sponsorships.proposals
      .filter((proposal) => proposal.status === "offered")
      .forEach((proposal) => upcoming.push({ title: proposal.company, date: proposal.expiresAt, type: "Proposta" }));
    state.sponsorships.contracts
      .filter((contract) => contract.status === "active")
      .forEach((contract) => upcoming.push({ title: contract.company, date: contract.endAt, type: "Contrato" }));
    state.staff.proposals
      .filter((proposal) => proposal.status === "waiting")
      .forEach((proposal) => upcoming.push({ title: proposal.professionalName, date: proposal.expiresAt, type: "Proposta funcionario" }));
    state.staff.development
      .filter((development) => development.status === "in_progress")
      .forEach((development) => upcoming.push({ title: development.employeeName, date: development.endAt, type: "Curso" }));
    getContractsExpiringSoon()
      .forEach((employee) => upcoming.push({ title: employee.name, date: employee.contractEndAt, type: "Contrato funcionario" }));
    if (state.municipalGrant.deadlineAt && ["accepted", "review_due"].includes(state.municipalGrant.status)) {
      upcoming.push({ title: "Compromisso municipal", date: state.municipalGrant.deadlineAt, type: "Verba" });
    }
    return upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function getImportantAlerts() {
    const alerts = [];
    if (state.finance.cash < 0) alerts.push({ tone: "danger", text: `Caixa negativo: ${money(state.finance.cash)}.` });
    if (state.finance.cash < getMonthlyExpenseTotal() && getMonthlyExpenseTotal() > 0) {
      alerts.push({ tone: "warn", text: "Caixa atual nao cobre a despesa mensal prevista." });
    }
    if (state.municipalGrant.debt > 0) {
      alerts.push({ tone: "danger", text: `Divida municipal ativa: ${money(state.municipalGrant.debt)}.` });
    }
    if (getUnseatedStaffCount() > 0) {
      alerts.push({ tone: "warn", text: `${getUnseatedStaffCount()} funcionario(s) sem capacidade administrativa disponivel.` });
    }
    getActiveConstructions().filter((work) => new Date(work.endAt).getTime() <= Clock.now() + MS_DAY).forEach((work) => {
      alerts.push({ tone: "warn", text: `Obra perto da conclusao: ${work.title}.` });
    });
    state.sponsorships.proposals.filter((proposal) => proposal.status === "offered" && new Date(proposal.expiresAt).getTime() <= Clock.now() + MS_DAY).forEach((proposal) => {
      alerts.push({ tone: "warn", text: `Proposta de patrocinio perto do fim: ${proposal.company}.` });
    });
    return alerts;
  }

  function hasYouthAcademySignal() {
    return state.facilities.trainingCenter.facilities.some((facility) => facility.typeId === "youth-academy" && facility.status === "active")
      || state.constructions.some((work) => work.status === "in_progress" && work.kind === "ct-facility" && work.payload.typeId === "youth-academy")
      || state.players.youth.length > 0;
  }

  function hasMedicalSignal() {
    return hasMedicalFacility()
      || getActiveStaff().some((employee) => employee.groupId === "medical");
  }

  function getOfficeRequiredStaffCount() {
    return getActiveStaff().filter((employee) => staffRoleById(employee.roleId)?.officeRequired).length;
  }

  function getUnseatedStaffCount() {
    return Math.max(0, getOfficeRequiredStaffCount() - getAdminCapacity());
  }

  function getVacantStaffRoles() {
    const filled = new Set(getActiveStaff().map((employee) => employee.roleId));
    return STAFF_ROLE_CATALOG.filter((role) => role.required && !filled.has(role.id));
  }

  function getContractsExpiringSoon() {
    const limit = addDays(Clock.iso(), 30);
    return getActiveStaff().filter((employee) => new Date(employee.contractEndAt) <= new Date(limit));
  }

  function getStaffInDevelopment() {
    return state.staff.development.filter((item) => item.status === "in_progress");
  }

  function getStaffAverageEfficiency() {
    const active = getActiveStaff();
    if (!active.length) return 0;
    const overloadPenalty = getUnseatedStaffCount() * 4;
    const total = active.reduce((sum, employee) => sum + getEmployeeEfficiency(employee, overloadPenalty), 0);
    return clamp(total / active.length, 0, 100);
  }

  function getEmployeeEfficiency(employee, overloadPenalty = getUnseatedStaffCount() * 4) {
    const avg = average(Object.values(employee.attributes || {}));
    const workloadPenalty = Math.max(0, employee.workload - 100) * 0.35;
    return clamp(avg * 0.55 + employee.performance * 0.3 + employee.moral * 0.15 - workloadPenalty - overloadPenalty, 0, 100);
  }

  function getGroupEfficiency(groupId) {
    const group = getActiveStaff().filter((employee) => employee.groupId === groupId);
    if (!group.length) return 0;
    return group.reduce((sum, employee) => sum + getEmployeeEfficiency(employee), 0) / group.length;
  }

  function getStaffYouthCoachQuality() {
    const coaches = getActiveStaff().filter((employee) => employee.roleId === "youth-coach");
    return staffAttributeAverage(coaches, "youthDevelopment");
  }

  function getStaffYouthScoutQuality() {
    const scouts = getActiveStaff().filter((employee) => ["scout", "chief-scout"].includes(employee.roleId));
    return staffAttributeAverage(scouts, "scouting");
  }

  function staffAttributeAverage(list, key) {
    if (!list.length) return 0;
    return list.reduce((sum, employee) => sum + (employee.attributes?.[key] || 0), 0) / list.length;
  }

  function average(values) {
    const valid = values.map(Number).filter(Number.isFinite);
    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function staffRoleById(roleId) {
    return STAFF_ROLE_CATALOG.find((role) => role.id === roleId);
  }

  function staffGroupLabel(groupId) {
    return STAFF_GROUPS.find((group) => group.id === groupId)?.label || "Equipe";
  }

  function staffLevelFromAttributes(attributes) {
    const score = average(Object.values(attributes || {}));
    if (score >= 82) return { label: "Excelente", tone: "good", score };
    if (score >= 68) return { label: "Bom", tone: "good", score };
    if (score >= 52) return { label: "Regular", tone: "info", score };
    if (score >= 36) return { label: "Basico", tone: "warn", score };
    return { label: "Inicial", tone: "danger", score };
  }

  function staffPreferenceLabel(preference) {
    if (preference === "association") return "Prefere Associacao";
    if (preference === "saf") return "Prefere SAF";
    return "Sem preferencia";
  }

  function getMainCategoryForView(view) {
    if (["overview"].includes(view)) return "central";
    if (PRESS_NAV_ITEMS.some((item) => item.view === view)) return "press";
    if (SQUAD_NAV_ITEMS.some((item) => item.view === view)) return "squad";
    if (MARKET_NAV_ITEMS.some((item) => item.view === view)) return "market";
    if (OFFICE_NAV_ITEMS.some((item) => item.view === view) || INSTALLATION_NAV_ITEMS.some((item) => item.view === view)) return "office";
    if (CALENDAR_NAV_ITEMS.some((item) => item.view === view) || view === "events") return "calendar";
    return "central";
  }

  function getMainNavCount(categoryId) {
    if (!state.club) return 0;
    if (categoryId === "central") return getImportantAlerts().length;
    if (categoryId === "press") return state.events.slice(0, 8).length;
    if (categoryId === "squad") return state.players.squad.length + state.players.youth.length;
    if (categoryId === "market") return state.players.tryoutFindings.length
      + state.staff.proposals.filter((proposal) => ["waiting", "counteroffer"].includes(proposal.status)).length;
    if (categoryId === "office") return getUnseatedStaffCount() + (state.municipalGrant.debt > 0 ? 1 : 0);
    if (categoryId === "calendar") return getUpcomingEventItems().length;
    return 0;
  }

  function getFilteredNavItems(items) {
    return items.filter((item) => {
      if (item.condition === "youth") return hasYouthAcademySignal();
      if (item.condition === "medical") return hasMedicalSignal();
      if (item.condition === "stadium") return hasStadiumSignal();
      return true;
    });
  }

  function renderSecondaryNav(items, label = "Navegacao secundaria") {
    const visibleItems = getFilteredNavItems(items);
    return `
      <div class="tabs-row section-tabs" aria-label="${label}">
        ${visibleItems.map((item) => {
          const isOfficeInstallations = items === OFFICE_NAV_ITEMS
            && item.view === "installations"
            && (currentView === "installations" || INSTALLATION_NAV_ITEMS.some((installation) => installation.view === currentView));
          const active = currentView === item.view || isOfficeInstallations;
          return `
          <button class="pill-button ${active ? "active" : ""}" data-view="${item.view}" data-route="${item.route}">
            ${item.label}
          </button>
        `;
        }).join("")}
      </div>
    `;
  }

  function renderContextCard({ title, text, actionLabel = "", view = "", route = "" }) {
    return `
      <div class="record row">
        <div>
          <div class="record-title">${title}</div>
          <div class="record-meta">${text}</div>
        </div>
        ${actionLabel ? `<button class="button small primary" data-view="${view}" data-route="${route || VIEW_ROUTES[view] || ""}">${actionLabel}</button>` : ""}
      </div>
    `;
  }

  function staffRoleOptions(selectedRoleId = "") {
    return STAFF_ROLE_CATALOG.map((role) => `
      <option value="${role.id}" ${selectedRoleId === role.id ? "selected" : ""}>${role.label}</option>
    `).join("");
  }

  function availableStaffCandidates() {
    const hiredIds = new Set(state.staff.employees.map((employee) => employee.professionalId));
    return state.staff.market.filter((professional) => !hiredIds.has(professional.id) && professional.status !== "rejected");
  }

  function getSelectedStaffCandidate() {
    const candidates = availableStaffCandidates();
    if (!candidates.length) return null;
    const drafted = candidates.find((item) => item.id === state.staff.draftProfessionalId);
    return drafted || candidates[0];
  }

  function filterStaffMarket() {
    const filters = state.staff.filters || {};
    const hiredIds = new Set(state.staff.employees.map((employee) => employee.professionalId));
    return state.staff.market.filter((professional) => {
      if (hiredIds.has(professional.id)) return false;
      if (!filters.status && professional.status === "rejected") return false;
      if (filters.name && !professional.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.group && professional.groupId !== filters.group) return false;
      if (filters.role && professional.primaryRoleId !== filters.role) return false;
      if (filters.level && staffLevelFromAttributes(professional.attributes).score < Number(filters.level)) return false;
      if (filters.maxSalary && professional.desiredSalary > Number(filters.maxSalary)) return false;
      if (filters.city && !professional.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.legalPreference && professional.legalPreference !== filters.legalPreference) return false;
      if (filters.status && professional.status !== filters.status) return false;
      return true;
    });
  }

  function staffOfferPreview(candidate, salary, roleId) {
    const result = evaluateStaffProposal(candidate, {
      roleId,
      salary: Number(salary),
      durationMonths: candidate.desiredMonths || 12,
      bonus: 0,
      terminationPenalty: Number(salary) * 3,
      goals: "",
      structure: "office",
      startAt: Clock.iso(),
    }, true);
    if (result.status === "accepted") return "Alta chance de aceite";
    if (result.status === "counteroffer") return `Pode pedir ${money(result.counterSalary)}`;
    if (result.status === "waiting") return "Pode pedir mais tempo";
    return "Risco alto de recusa";
  }

  function getStaffStructureScore(roleId, structure) {
    const role = staffRoleById(roleId);
    if (role?.officeRequired) {
      const freeSeats = getAdminCapacity() - getOfficeRequiredStaffCount();
      if (structure === "office" && freeSeats > 0) return 1;
      if (freeSeats > 0) return 0.72;
      return 0.15;
    }
    if (role?.group === "medical") return hasMedicalFacility() ? 1 : 0.55;
    if (role?.group === "operations") return hasCtSignal() || hasStadiumSignal() ? 0.9 : 0.62;
    if (role?.group === "coaches" || role?.group === "technical") return hasCtSignal() ? 0.9 : 0.58;
    return 0.7;
  }

  function hasMedicalFacility() {
    return state.facilities.trainingCenter.facilities.some((facility) => facility.typeId === "medical" && facility.status === "active");
  }

  function evaluateStaffProposal(candidate, offer, finalPass = false) {
    const desired = candidate.desiredSalary || 1;
    const salaryRatio = Number(offer.salary || 0) / desired;
    const reputationScore = clamp(getReputationAverage() / 5, 0, 1);
    const structureScore = getStaffStructureScore(offer.roleId, offer.structure);
    const roleFit = offer.roleId === candidate.primaryRoleId
      ? 1
      : candidate.secondaryRoles.includes(staffRoleById(offer.roleId)?.label)
        ? 0.72
        : 0.42;
    const financialStability = state.finance.cash >= getMonthlyExpenseTotal() * 2 ? 1 : state.finance.cash >= 0 ? 0.62 : 0.25;
    const legalFit = candidate.legalPreference === "neutral" || candidate.legalPreference === state.club.legalModel ? 1 : 0.72;
    const distanceFit = candidate.city === state.club.city ? 1 : candidate.state === state.club.state ? 0.82 : 0.58;
    const projectScore = state.promises.length ? 0.88 : 0.62;
    const role = staffRoleById(offer.roleId);

    if (role?.officeRequired && getAdminCapacity() - getOfficeRequiredStaffCount() <= 0) {
      return {
        status: "rejected",
        score: 0,
        reason: "Recusa por falta de sala administrativa disponivel para cargo estrategico.",
      };
    }

    if (salaryRatio < 0.72) {
      return {
        status: "counteroffer",
        score: salaryRatio,
        counterSalary: Math.round(desired * 1.04),
        reason: "Salario oferecido abaixo do minimo esperado.",
      };
    }

    const score = salaryRatio * 0.34
      + reputationScore * 0.16
      + structureScore * 0.15
      + roleFit * 0.11
      + financialStability * 0.09
      + legalFit * 0.06
      + distanceFit * 0.05
      + projectScore * 0.04;

    if (score >= 0.82) {
      return { status: "accepted", score, reason: "Proposta aceita pelos criterios simulados." };
    }
    if (score >= 0.67) {
      return {
        status: "counteroffer",
        score,
        counterSalary: Math.round(Math.max(desired, Number(offer.salary || 0) * 1.08)),
        reason: "Profissional fez contraproposta salarial.",
      };
    }
    if (!finalPass && score >= 0.52) {
      return { status: "waiting", score, reason: "Profissional pediu mais tempo para avaliar estrutura e projeto." };
    }
    return { status: "rejected", score, reason: "Proposta recusada pelos criterios simulados." };
  }

  function addStaffHistory({ professionalName, event, financialImpact = 0, sportingImpact = 0, institutionalImpact = 0, date = Clock.iso() }) {
    state.staff.history.unshift({
      id: uid("staff-history"),
      professionalName,
      event,
      date,
      financialImpact,
      sportingImpact,
      institutionalImpact,
    });
    state.staff.history = state.staff.history.slice(0, 180);
  }

  function getLandUsage(landId) {
    const ctActive = state.facilities.trainingCenter.facilities
      .filter((facility) => facility.landId === landId && facility.status === "active")
      .reduce((sum, facility) => sum + facility.area, 0);
    const ctWorks = state.constructions
      .filter((work) => work.status === "in_progress" && work.kind === "ct-facility" && work.payload.landId === landId)
      .reduce((sum, work) => sum + work.payload.area, 0);
    const stadiumArea = getStadiumRequiredArea(landId);
    return ctActive + ctWorks + stadiumArea;
  }

  function getLandFreeArea(landId) {
    const land = state.facilities.lands.find((item) => item.id === landId);
    if (!land) return 0;
    return Math.max(0, land.area - getLandUsage(landId));
  }

  function getStadiumRequiredArea(landId, extraSeats = 0, ignoreModuleId = null) {
    const activeSeats = state.facilities.stadium.modules
      .filter((module) => module.landId === landId && module.status === "active" && module.id !== ignoreModuleId)
      .reduce((sum, module) => sum + module.seats, 0);
    const workSeats = state.constructions
      .filter((work) => work.status === "in_progress" && work.kind === "stadium-module" && work.payload.landId === landId)
      .reduce((sum, work) => sum + work.payload.seats, 0);
    const totalSeats = activeSeats + workSeats + extraSeats;
    if (totalSeats <= 0) return 0;
    return totalSeats > 36000 ? 120000 : 60000;
  }

  function hasCtSignal() {
    return state.facilities.trainingCenter.facilities.some((facility) => facility.status === "active")
      || state.constructions.some((work) => work.status === "in_progress" && work.kind === "ct-facility");
  }

  function hasStadiumSignal() {
    return state.facilities.stadium.modules.some((module) => module.status === "active")
      || state.constructions.some((work) => work.status === "in_progress" && work.kind === "stadium-module");
  }

  function calculateYouthQuality() {
    const structure = getYouthStructureContribution();
    const coachesSource = Math.max(clamp(state.youthAcademy.coaches, 0, 100), getStaffYouthCoachQuality());
    const scoutsSource = Math.max(clamp(state.youthAcademy.scouts, 0, 100), getStaffYouthScoutQuality());
    const coaches = coachesSource * 0.21;
    const scouts = scoutsSource * 0.21;
    const methodology = clamp(state.youthAcademy.methodology, 0, 100) * 0.16;
    const total = clamp(structure + coaches + scouts + methodology, 0, 100);
    return { structure, coaches, scouts, methodology, total, coachesSource, scoutsSource };
  }

  function getYouthStructureContribution() {
    const youthFacilities = state.facilities.trainingCenter.facilities
      .filter((facility) => facility.typeId === "youth-academy" && facility.status === "active");
    if (youthFacilities.length === 0) return 0;
    const best = youthFacilities.reduce((top, facility) => {
      const score = LEVELS.find((level) => level.id === facility.level)?.value || 0;
      return Math.max(top, score);
    }, 0);
    return (best / 100) * 42;
  }

  function createClub(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const created = createEmptyState();
    created.club = {
      fullName: data.fullName.trim(),
      shortName: data.shortName.trim(),
      acronym: data.acronym.trim().toUpperCase().slice(0, 4),
      state: data.state.trim(),
      city: data.city.trim(),
      colors: {
        primary: data.primaryColor,
        secondary: data.secondaryColor,
        accent: data.accentColor,
      },
      shieldShape: data.shieldShape,
      uniformPattern: data.uniformPattern,
      mascot: data.mascot.trim(),
      legalModel: data.legalModel,
      foundedAt: Clock.iso(),
      hashtag: makeClubHashtag(data.shortName.trim() || data.acronym.trim()),
      sharesOwnedByPlayer: data.legalModel === "saf" ? 100 : null,
    };
    state = created;
    seedReputationHistory(state);
    seedStaffMarket(state);
    addEvent({
      type: "foundation",
      title: "Clube fundado",
      description: `${state.club.fullName} foi fundado em ${state.club.city}.`,
    });
    currentView = "overview";
    setPrototypeRoute("/central");
    saveState();
    render();
    toast("Clube criado. O relogio do prototipo ja esta rodando.");
  }

  function legalModelLabel() {
    return state.club?.legalModel === "association" ? "Associacao" : "SAF";
  }

  function crestMarkup(club = state.club, className = "") {
    const acronym = escapeHtml(club?.acronym || "FC");
    const colors = club?.colors || { primary: "#0b7a53", secondary: "#ffffff", accent: "#d8a21a" };
    const shape = club?.shieldShape || "shield";
    return `<div class="crest shape-${shape} ${className}" data-acronym="${acronym}" style="--crest-primary:${colors.primary};--crest-secondary:${colors.secondary};--crest-accent:${colors.accent}"></div>`;
  }

  function jerseyMarkup(club = state.club) {
    const colors = club?.colors || { primary: "#0b7a53", secondary: "#ffffff" };
    const pattern = club?.uniformPattern || "plain";
    return `<div class="jersey pattern-${pattern}" style="--shirt-primary:${colors.primary};--shirt-secondary:${colors.secondary}"></div>`;
  }

  function render() {
    const changes = processWorldProgress(false);
    if (changes.length) saveState();
    const app = document.querySelector("#app");
    app.innerHTML = state.club ? renderShell() : renderSetup();
    updateLivePieces();
    updateEstimators();
  }

  function renderSetup() {
    return `
      <section class="setup-page">
        <div class="setup-hero">
          <div>
            <div class="setup-kicker">Prototipo persistente</div>
            <h1>Gestao de clube do zero</h1>
            <p>Um simulador local para testar fundacao, patrimonio, obras, reputacao e captacao sem backend real nesta primeira etapa.</p>
          </div>
          <div class="hero-metrics">
            <div class="hero-metric"><strong>R$ 0</strong><span>Caixa inicial para todos os clubes</span></div>
            <div class="hero-metric"><strong>1:1</strong><span>Tempo real como base da simulacao</span></div>
            <div class="hero-metric"><strong>100%</strong><span>Clubes humanos no desenho futuro</span></div>
          </div>
        </div>
        <div class="setup-form-wrap">
          <form id="create-club-form" class="setup-panel">
            <h2>Criar clube</h2>
            <p>Fundacao registrada com a data atual do sistema. A validacao por servidor fica preparada para uma etapa futura.</p>

            <div class="model-grid" role="radiogroup" aria-label="Modelo juridico">
              <label class="model-card">
                <input type="radio" name="legalModel" value="association" checked />
                <span class="model-body">
                  <strong>Associa&ccedil;&atilde;o</strong>
                  <span>Doacoes iniciais, verba municipal, conselho e aproximacao comunitaria.</span>
                  <span>Decisoes mais lentas e pressao institucional futura.</span>
                </span>
              </label>
              <label class="model-card">
                <input type="radio" name="legalModel" value="saf" />
                <span class="model-body">
                  <strong>SAF</strong>
                  <span>Decisoes mais rapidas, investidores futuros e 30% a mais nos patrocinicios aceitos.</span>
                  <span>Sem doacoes iniciais e sem verba municipal.</span>
                </span>
              </label>
            </div>

            <div class="form-grid">
              <label class="field full">Nome completo
                <input name="fullName" required maxlength="70" placeholder="Esporte Clube Horizonte" />
              </label>
              <label class="field">Nome curto
                <input name="shortName" required maxlength="28" placeholder="Horizonte" />
              </label>
              <label class="field">Sigla
                <input name="acronym" required maxlength="4" placeholder="ECH" />
              </label>
              <label class="field">Estado
                <input name="state" required maxlength="32" placeholder="SP" />
              </label>
              <label class="field">Cidade
                <input name="city" required maxlength="42" placeholder="Campinas" />
              </label>
              <label class="field">Mascote
                <input name="mascot" required maxlength="34" placeholder="Lobo" />
              </label>
              <label class="field">Formato do escudo
                <select name="shieldShape">
                  <option value="shield">Escudo classico</option>
                  <option value="round">Circular</option>
                  <option value="diamond">Losango</option>
                </select>
              </label>
              <label class="field">Uniforme
                <select name="uniformPattern">
                  <option value="plain">Liso</option>
                  <option value="stripes">Listrado</option>
                  <option value="diagonal">Faixa diagonal</option>
                  <option value="hoops">Listras horizontais</option>
                </select>
              </label>
              <label class="field">Cor principal
                <input type="color" name="primaryColor" value="#0b7a53" />
              </label>
              <label class="field">Cor secundaria
                <input type="color" name="secondaryColor" value="#ffffff" />
              </label>
              <label class="field">Cor de detalhe
                <input type="color" name="accentColor" value="#d8a21a" />
              </label>
            </div>

            <div class="visual-row">
              <div id="setup-crest">${crestMarkup({ acronym: "FC", shieldShape: "shield", colors: { primary: "#0b7a53", secondary: "#ffffff", accent: "#d8a21a" } })}</div>
              <div id="setup-jersey">${jerseyMarkup({ uniformPattern: "plain", colors: { primary: "#0b7a53", secondary: "#ffffff" } })}</div>
              <div>
                <strong>Identidade visual inicial</strong>
                <p class="muted">Escudo e uniforme usam formas e padroes basicos nesta etapa.</p>
              </div>
            </div>

            <div class="button-row">
              <button class="button primary" type="submit">Criar clube</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderShell() {
    const viewInfo = VIEW_INFO[currentView] || VIEW_INFO.overview;
    const activeCategory = getMainCategoryForView(currentView);
    return `
      <div class="shell">
        <aside class="sidebar">
          <div class="brand-block">
            ${crestMarkup(state.club)}
            <div>
              <h1>${escapeHtml(state.club.shortName)}</h1>
              <span>${escapeHtml(state.club.city)} - ${escapeHtml(state.club.state)} &middot; ${legalModelLabel()}</span>
            </div>
          </div>
          <nav class="nav" aria-label="Menu principal">
            ${NAV_ITEMS.map((item) => `
              <button class="nav-button ${activeCategory === item.id ? "active" : ""}" data-view="${item.view}" data-route="${item.route}">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
                ${getMainNavCount(item.id) ? `<span class="nav-count">${getMainNavCount(item.id)}</span>` : ""}
              </button>
            `).join("")}
          </nav>
          <div class="sidebar-footer">
            Tempo real 1:1. O prototipo usa o horario local e guarda tudo no navegador.
          </div>
        </aside>
        <main class="workspace">
          <header class="topbar">
            <div class="view-title">
              <h1>${viewInfo.title}</h1>
              <p>${viewInfo.subtitle}</p>
            </div>
            <div class="server-clock">
              <span>${APP_ENV === "beta" ? "Servidor Beta" : "Servidor simulado"}</span>
              <strong id="server-clock">${formatDate(Clock.iso())}</strong>
              <em>Vers&atilde;o ${escapeHtml(APP_VERSION)}</em>
            </div>
          </header>
          ${renderCurrentView()}
        </main>
      </div>
    `;
  }

  function renderCurrentView() {
    const views = {
      overview: renderOverview,
      pressFeed: () => renderPress("stands"),
      pressClub: () => renderPress("club"),
      pressMarket: () => renderPress("ball-market"),
      pressHorizon: () => renderPress("horizon"),
      pressCommunications: () => renderPress("communications"),
      pressClubSearch: () => renderPress("club-search"),
      pressPublicProfile: renderPublicClubProfile,
      foundation: () => renderOfficeSection(renderFoundation()),
      finances: () => renderOfficeSection(renderFinances()),
      reputation: () => renderOfficeSection(renderReputation()),
      sponsorship: () => renderOfficeSection(renderSponsorship()),
      staff: renderStaff,
      property: () => renderOfficeSection(renderProperty()),
      installations: renderInstallations,
      rooms: () => renderOfficeSection(renderRooms(), "rooms"),
      land: () => renderOfficeSection(renderLand(), "land"),
      training: () => renderOfficeSection(renderTraining(), "training"),
      stadium: () => renderOfficeSection(renderStadium(), "stadium"),
      administration: renderAdministration,
      youth: renderYouth,
      squad: renderSquad,
      squadTraining: renderSquadTraining,
      squadMedical: renderSquadMedical,
      squadInternal: renderSquadInternal,
      marketPlayers: renderMarketPlayers,
      marketObservation: renderMarketObservation,
      marketTryouts: renderMarketTryouts,
      marketRealEstate: renderMarketRealEstate,
      marketHistory: renderMarketHistory,
      calendarAgenda: () => renderCalendar("agenda"),
      calendarUpcoming: () => renderCalendar("upcoming"),
      calendarCompleted: () => renderCalendar("completed"),
      calendarSchedules: () => renderCalendar("schedules"),
      calendarAlerts: () => renderCalendar("alerts"),
      events: () => renderCalendar("completed"),
      settings: renderAdministration,
    };
    return (views[currentView] || renderOverview)();
  }

  function renderOfficeSection(content, installationTab = "") {
    if (installationTab) currentInstallationTab = installationTab;
    return `${renderSecondaryNav(OFFICE_NAV_ITEMS, "Navegacao interna de Escritorio")}${content}`;
  }

  function renderInstallations() {
    const tabs = getFilteredNavItems(INSTALLATION_NAV_ITEMS);
    if (!tabs.some((item) => item.id === currentInstallationTab)) currentInstallationTab = tabs[0]?.id || "training";
    const active = tabs.find((item) => item.id === currentInstallationTab) || tabs[0];
    const content = {
      stadium: renderStadium,
      training: renderTraining,
      rooms: renderRooms,
      land: renderLand,
    }[active?.id] || renderTraining;
    return `
      ${renderSecondaryNav(OFFICE_NAV_ITEMS, "Navegacao interna de Escritorio")}
      <div class="tabs-row section-tabs" aria-label="Instalacoes">
        ${tabs.map((item) => `
          <button class="pill-button ${currentInstallationTab === item.id ? "active" : ""}" data-installation-tab="${item.id}" data-route="${item.route}">
            ${item.label}
          </button>
        `).join("")}
      </div>
      ${content()}
    `;
  }

  function renderAdministration() {
    return `
      ${renderSecondaryNav(OFFICE_NAV_ITEMS, "Navegacao interna de Escritorio")}
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Administra&ccedil;&atilde;o do clube</h2><p>Modelo juridico, dados institucionais, promessas e configuracoes locais.</p></div>
            <span class="badge info">${legalModelLabel()}</span>
          </div>
          <div class="asset-map">
            <div class="asset-tile"><span>Clube</span><strong>${escapeHtml(state.club.shortName)}</strong><em>${escapeHtml(state.club.city)} / ${escapeHtml(state.club.state)}</em></div>
            <div class="asset-tile"><span>Funda&ccedil;&atilde;o</span><strong>${formatDate(state.club.foundedAt)}</strong><em>Data real do cadastro.</em></div>
            <div class="asset-tile"><span>Funcion&aacute;rios admin.</span><strong>${getActiveStaff().filter((employee) => employee.groupId === "administrative").length}</strong><em>Capacidade: ${getOfficeRequiredStaffCount()}/${getAdminCapacity()}</em></div>
            <div class="asset-tile"><span>Promessas</span><strong>${state.promises.length}</strong><em>Ativas no discurso publico.</em></div>
          </div>
        </div>
      </section>
      ${renderFoundation()}
      ${renderSettings()}
    `;
  }

  function renderPress(activeTab) {
    const renderers = {
      stands: renderPressStands,
      club: renderPressMyClub,
      "ball-market": renderPressBallMarket,
      horizon: renderPressHorizon,
      communications: renderPressCommunications,
      "club-search": renderPressClubSearch,
    };
    return `
      ${renderSecondaryNav(PRESS_NAV_ITEMS, "Navegacao interna de Imprensa")}
      ${(renderers[activeTab] || renderPressStands)()}
    `;
  }

  function renderPressStands() {
    const posts = getArquibancadaPosts();
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header">
            <div><h2>Arquibancada</h2><p>Rede social ficticia do jogo. Somente acontecimentos relevantes entram aqui.</p></div>
            <span class="badge info">${posts.length} destaque(s)</span>
          </div>
          ${renderPressFeed(posts, true)}
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Crit&eacute;rio de relev&acirc;ncia</h2><p>Eventos cotidianos ficam em Meu Clube.</p></div></div>
          <div class="stack">
            <div class="notice">Publica patrocinios grandes, CT ou estadio relevante, divida grave, jovens de alto potencial e comunicados de alcance publico.</div>
            <div class="notice warn">Nao publica pagamentos comuns, manutencao, pequenas obras ou rotinas administrativas.</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPressMyClub() {
    const posts = getMyClubPressPosts();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Meu Clube</h2><p>Informativo privado do dirigente. Estes itens nao aparecem para outros jogadores.</p></div>
            <span class="badge info">${posts.length} item(ns)</span>
          </div>
          ${renderPressFeed(posts)}
        </div>
      </section>
    `;
  }

  function renderPressBallMarket() {
    const posts = getBallMarketPosts();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Mercado da Bola</h2><p>Noticias publicas de jogadores e transferencias, sem detalhes confidenciais.</p></div>
            <span class="badge info">${posts.length} registro(s)</span>
          </div>
          <div class="tabs-row">
            ${TRANSFER_FILTERS.map((filter) => `
              <button class="pill-button ${state.press.transferFilter === filter.id ? "active" : ""}" data-transfer-filter="${filter.id}">
                ${filter.label}
              </button>
            `).join("")}
          </div>
          ${renderPressFeed(posts, true)}
        </div>
      </section>
    `;
  }

  function renderPressHorizon() {
    const posts = getHorizonPosts();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Jornal Horizonte</h2><p>Veiculo de comunicados e noticias oficiais do universo do jogo.</p></div>
            <span class="badge info">${posts.length} noticia(s)</span>
          </div>
          <div class="tabs-row">
            ${HORIZON_FILTERS.map((filter) => `
              <button class="pill-button ${state.press.horizonFilter === filter.id ? "active" : ""}" data-horizon-filter="${filter.id}">
                ${filter.label}
              </button>
            `).join("")}
          </div>
          ${renderPressFeed(posts, true)}
        </div>
      </section>
    `;
  }

  function renderPressFeed(posts, showRelevance = false) {
    if (!posts.length) return empty("Nenhuma publicacao para esta aba.");
    return `<div class="table-list">
      ${posts.map((post) => `
        <article class="record">
          <div class="record-title">${escapeHtml(post.title)} <span class="badge ${post.toneClass}">${escapeHtml(post.tone)}</span></div>
          <div class="record-meta">${escapeHtml(post.source)} &middot; ${escapeHtml(post.category)} &middot; ${formatDate(post.date)} &middot; Alcance ${number(post.reach)}</div>
          <div class="record-meta">${escapeHtml(post.text)}</div>
          <div class="status-line">
            ${(post.clubs || []).map((club) => renderClubHashtag(club)).join("")}
            ${showRelevance ? `<span class="badge ${post.relevance >= 85 ? "good" : post.relevance >= 65 ? "info" : "warn"}">Relev&acirc;ncia ${post.relevanceLevel}</span>` : ""}
            <span class="badge">Impacto ${escapeHtml(post.impact)}</span>
            <span class="badge">${number(post.likes)} curtidas</span>
            <span class="badge">${number(post.comments)} comentarios</span>
            <span class="badge">${number(post.shares)} compartilhamentos</span>
          </div>
          ${post.targetView ? `<div class="action-row"><button class="button small" data-view="${post.targetView}" data-route="${post.targetRoute || VIEW_ROUTES[post.targetView] || ""}">Abrir &aacute;rea relacionada</button></div>` : ""}
        </article>
      `).join("")}
    </div>`;
  }

  function renderPressCommunications() {
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header"><div><h2>Nova nota &agrave; imprensa</h2><p>Crie rascunhos, agende ou publique comunicados oficiais.</p></div></div>
          <form id="press-communication-form" class="form-grid">
            <label class="field">Titulo
              <input name="title" required maxlength="90" placeholder="Nota oficial sobre..." />
            </label>
            <label class="field">Categoria
              <select name="category">
                ${COMMUNICATION_TYPES.map((type) => `<option>${type}</option>`).join("")}
              </select>
            </label>
            <label class="field">Autor ou cargo
              <input name="author" maxlength="60" value="Diretoria" />
            </label>
            <label class="field">Status
              <select name="status">
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendado</option>
                <option value="withdrawn">Retirado</option>
              </select>
            </label>
            <label class="field">Localidade
              <select name="locality">
                <option value="city">Cidade</option>
                <option value="region">Regiao</option>
                <option value="state">Estado</option>
                <option value="national">Nacional</option>
              </select>
            </label>
            <label class="field">Data de publicacao
              <input name="publishAt" type="datetime-local" value="${toDateTimeLocal(Clock.iso())}" />
            </label>
            <label class="field full">Texto
              <textarea name="text" required maxlength="900" placeholder="Escreva a nota com clareza. Promessas publicas ficam registradas para comparacao futura."></textarea>
            </label>
            <div class="field full">
              <div class="notice">Impacto simples: comunicados transparentes podem reduzir danos, promessas aumentam expectativa e pedidos de desculpas podem recuperar um pouco a reputacao institucional. Nao ha bonus automatico por publicar.</div>
              <button class="button primary" type="submit">Salvar comunicado</button>
            </div>
          </form>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Promessas ativas</h2><p>Compromissos publicos em acompanhamento.</p></div></div>
          ${state.promises.length ? `
            <div class="table-list">
              ${state.promises.map((promise) => `
                <div class="record">
                  <div class="record-title">${escapeHtml(promise.channel)}</div>
                  <div class="record-meta">${escapeHtml(promise.text)} &middot; ${formatDate(promise.date)}</div>
                </div>
              `).join("")}
            </div>
          ` : empty("Nenhuma promessa ativa.")}
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Notas do clube</h2><p>Rascunhos, agendadas, publicadas e retiradas.</p></div></div>
          ${renderCommunicationList(state.press.communications)}
        </div>
      </section>
    `;
  }

  function renderCommunicationList(list) {
    if (!list.length) return empty("Nenhuma nota a imprensa salva.");
    return `<div class="table-list">
      ${list.map((note) => `
        <div class="record">
          <div class="record-title">${escapeHtml(note.title)} <span class="badge ${communicationStatusTone(note.status)}">${communicationStatusLabel(note.status)}</span></div>
          <div class="record-meta">${escapeHtml(note.category)} &middot; ${escapeHtml(note.author)} &middot; ${formatDate(note.publishAt)} &middot; Alcance ${number(note.reach)}</div>
          <div class="record-meta">${escapeHtml(note.text)}</div>
          <div class="status-line">
            ${renderClubHashtag(note.club || getCurrentPublicClub())}
            <span class="badge">Repercussao ${escapeHtml(note.repercussion)}</span>
            <span class="badge">Impacto inst. ${number(note.impact.institutional, 2)}</span>
            <span class="badge">Impacto fin. ${number(note.impact.financial, 2)}</span>
            <span class="badge">Impacto esp. ${number(note.impact.sporting, 2)}</span>
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function renderPressClubSearch() {
    const results = searchPublicClubs();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Busca de clubes</h2><p>Busca local simulada por nome, sigla, cidade, estado, hashtag, estadio ou modelo juridico.</p></div></div>
          <form id="club-search-form" class="form-grid">
            <label class="field full">Buscar
              <input name="query" value="${escapeHtml(state.press.clubSearch || "")}" placeholder="#atleticodovale, Campinas, SAF, Arena..." />
            </label>
            <div class="field full"><button class="button primary" type="submit">Buscar clubes</button></div>
          </form>
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Resultados</h2><p>${results.length} perfil(is) publico(s) encontrado(s).</p></div></div>
          ${renderClubSearchResults(results)}
        </div>
      </section>
    `;
  }

  function renderClubSearchResults(clubs) {
    if (!clubs.length) return empty("Nenhum clube encontrado.");
    return `<div class="table-list">
      ${clubs.map((club) => `
        <div class="record row">
          <div>
            <div class="record-title">${crestMarkup(club, "mini-crest")} ${escapeHtml(club.fullName)} ${renderClubHashtag(club)}</div>
            <div class="record-meta">${escapeHtml(club.acronym)} &middot; ${escapeHtml(club.city)}/${escapeHtml(club.state)} &middot; ${escapeHtml(publicLegalModelLabel(club.legalModel))} &middot; Reputacao ${number(publicReputationAverage(club), 2)}</div>
          </div>
          <button class="button small primary" data-profile-slug="${club.slug}">Abrir perfil</button>
        </div>
      `).join("")}
    </div>`;
  }

  function renderPublicClubProfile() {
    const club = getPublicClubBySlug(state.press.profileSlug) || getCurrentPublicClub();
    state.press.profileSlug = club.slug;
    const tab = state.press.profileTab || "overview";
    return `
      ${renderSecondaryNav(PRESS_NAV_ITEMS, "Navegacao interna de Imprensa")}
      <section class="public-profile">
        <div class="profile-cover" style="--profile-primary:${club.colors.primary};--profile-secondary:${club.colors.secondary};--profile-accent:${club.colors.accent}">
          <div class="profile-cover-content">
            ${crestMarkup(club)}
            <div>
              <h2>${escapeHtml(club.fullName)}</h2>
              <div class="status-line">
                ${renderClubHashtag(club)}
                <span class="badge">${escapeHtml(club.city)} / ${escapeHtml(club.state)}</span>
                <span class="badge">${escapeHtml(publicLegalModelLabel(club.legalModel))}</span>
                <span class="badge">Fundado em ${formatDate(club.foundedAt)}</span>
              </div>
            </div>
            <button class="button primary" data-action="follow-public-club" data-id="${club.id}">${state.press.followedClubIds.includes(club.id) ? "Acompanhando" : "Acompanhar"}</button>
          </div>
        </div>
        <div class="tabs-row section-tabs">
          ${PRESS_PUBLIC_PROFILE_TABS.map((profileTab) => `
            <button class="pill-button ${tab === profileTab.id ? "active" : ""}" data-public-profile-tab="${profileTab.id}">
              ${profileTab.label}
            </button>
          `).join("")}
        </div>
        ${renderPublicProfileTab(club, tab)}
      </section>
    `;
  }

  function renderPublicProfileTab(club, tab) {
    const renderers = {
      overview: () => renderPublicProfileOverview(club),
      squad: () => renderPublicProfileSquad(club),
      staff: () => renderPublicProfileStaff(club),
      stadium: () => renderPublicProfileStadium(club),
      training: () => renderPublicProfileTraining(club),
      notes: () => renderPublicProfileNotes(club),
    };
    return (renderers[tab] || renderers.overview)();
  }

  function renderPublicProfileOverview(club) {
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header"><div><h2>Vis&atilde;o geral</h2><p>Perfil publico sem dados privados.</p></div></div>
          <div class="asset-map">
            <div class="asset-tile"><span>Nome curto</span><strong>${escapeHtml(club.shortName)}</strong><em>${escapeHtml(club.acronym)}</em></div>
            <div class="asset-tile"><span>Mascote</span><strong>${escapeHtml(club.mascot || "Nao informado")}</strong><em>${escapeHtml(publicLegalModelLabel(club.legalModel))}</em></div>
            <div class="asset-tile"><span>Reputa&ccedil;&atilde;o</span><strong>${number(publicReputationAverage(club), 2)}</strong><em>Resumo publico</em></div>
            <div class="asset-tile"><span>Elenco</span><strong>${club.squad.length}</strong><em>Atletas publicos</em></div>
            <div class="asset-tile"><span>Est&aacute;dio</span><strong>${escapeHtml(club.stadium.name)}</strong><em>${number(club.stadium.capacity)} lugares</em></div>
            <div class="asset-tile"><span>CT</span><strong>${escapeHtml(club.trainingCenter.name)}</strong><em>${club.trainingCenter.facilities.length} instalacao(oes)</em></div>
          </div>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>&Uacute;ltimas not&iacute;cias</h2><p>Publicacoes visiveis no perfil.</p></div></div>
          ${renderPressFeed(getPublicClubPosts(club).slice(0, 3))}
        </div>
      </section>
    `;
  }

  function renderPublicProfileSquad(club) {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Elenco publico</h2><p>Sem salario, contrato, potencial, moral ou dados medicos.</p></div></div>
          <div class="table-list">
            ${club.squad.map((player) => `
              <div class="record row">
                <span>${escapeHtml(player.name)}</span>
                <span class="badge">${player.age} anos &middot; ${escapeHtml(player.position)}</span>
              </div>
            `).join("") || empty("Nenhum atleta publico.")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPublicProfileStaff(club) {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Equipe publica</h2><p>Mostra apenas nome e cargo publico.</p></div></div>
          <div class="table-list">
            ${club.staff.map((member) => `
              <div class="record row">
                <span>${escapeHtml(member.name)}</span>
                <span class="badge">${escapeHtml(member.role)}</span>
              </div>
            `).join("") || empty("Nenhum profissional publico.")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPublicProfileStadium(club) {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Est&aacute;dio</h2><p>Sem valores financeiros privados.</p></div></div>
          <div class="asset-map">
            <div class="asset-tile"><span>Nome</span><strong>${escapeHtml(club.stadium.name)}</strong><em>${escapeHtml(club.stadium.city)}</em></div>
            <div class="asset-tile"><span>Capacidade</span><strong>${number(club.stadium.capacity)}</strong><em>Lugares</em></div>
            <div class="asset-tile"><span>Propriedade</span><strong>${escapeHtml(club.stadium.ownership)}</strong><em>${escapeHtml(club.stadium.modules)}</em></div>
            <div class="asset-tile"><span>Nivel geral</span><strong>${escapeHtml(club.stadium.level)}</strong><em>Naming rights futuro</em></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderPublicProfileTraining(club) {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Centro de Treinamento</h2><p>Sem custos, manutencao, area livre ou obras confidenciais.</p></div></div>
          <div class="record">
            <div class="record-title">${escapeHtml(club.trainingCenter.name)}</div>
            <div class="record-meta">${escapeHtml(club.trainingCenter.city)}</div>
          </div>
          <div class="table-list" style="margin-top:12px">
            ${club.trainingCenter.facilities.map((facility) => `<div class="record">${escapeHtml(facility)}</div>`).join("") || empty("Nenhuma instalacao publica.")}
          </div>
        </div>
      </section>
    `;
  }

  function renderPublicProfileNotes(club) {
    const notes = getPublishedCommunicationsForClub(club);
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Notas &agrave; Imprensa</h2><p>Comunicados publicados e visiveis ao publico.</p></div></div>
          ${renderCommunicationList(notes)}
        </div>
      </section>
    `;
  }

  function getCurrentPublicClub() {
    const activeStadiumModules = state.facilities.stadium.modules.filter((module) => module.status === "active");
    const publicStadium = activeStadiumModules.length
      ? {
        name: `${state.club.shortName} Arena`,
        capacity: getStadiumCapacity(),
        city: state.club.city,
        ownership: "Proprio",
        modules: `${activeStadiumModules.length} modulo(s)`,
        level: getBestLevelLabel(activeStadiumModules.map((module) => module.level)),
      }
      : {
        name: state.facilities.municipalField?.active ? "Campo municipal" : "Sem estadio proprio",
        capacity: getStadiumCapacity(),
        city: state.club.city,
        ownership: state.facilities.municipalField?.active ? "Publico" : "Indefinido",
        modules: state.facilities.municipalField?.active ? "Uso municipal" : "Nenhum modulo",
        level: "Inicial",
      };

    const ctFacilities = state.facilities.trainingCenter.facilities
      .filter((facility) => facility.status === "active")
      .map((facility) => `${facility.displayName || facility.label}: ${getLevelLabel(facility.level)}`);

    return {
      id: "my-club",
      slug: slugify(state.club.shortName || state.club.acronym),
      fullName: state.club.fullName,
      shortName: state.club.shortName,
      acronym: state.club.acronym,
      city: state.club.city,
      state: state.club.state,
      legalModel: state.club.legalModel,
      mascot: state.club.mascot,
      colors: state.club.colors,
      shieldShape: state.club.shieldShape,
      uniformPattern: state.club.uniformPattern,
      foundedAt: state.club.foundedAt,
      hashtag: state.club.hashtag || makeClubHashtag(state.club.shortName),
      publicReputation: {
        institutional: state.reputations.institutional.value,
        financial: state.reputations.financial.value,
        sporting: state.reputations.sporting.value,
      },
      stadium: publicStadium,
      trainingCenter: {
        name: ctFacilities.length ? `${state.club.shortName} CT` : "Sem CT publico",
        city: state.club.city,
        facilities: ctFacilities,
      },
      squad: state.players.squad.map((player) => ({ name: player.name, age: player.age, position: player.position })),
      staff: getActiveStaff().map((employee) => ({ name: employee.name, role: employee.roleLabel })),
    };
  }

  function getDemoPublicClubs() {
    return DEMO_CLUB_BLUEPRINTS.map((club) => ({
      ...club,
      slug: club.id,
      hashtag: makeClubHashtag(club.shortName),
    }));
  }

  function getAllPublicClubs() {
    return [getCurrentPublicClub(), ...getDemoPublicClubs()];
  }

  function getPublicClubBySlug(slug) {
    return getAllPublicClubs().find((club) => club.slug === slug || slugify(club.shortName) === slug);
  }

  function renderClubHashtag(club) {
    if (!club) return "";
    return `<button class="hashtag-link" data-profile-slug="${club.slug}">${escapeHtml(club.hashtag || makeClubHashtag(club.shortName))}</button>`;
  }

  function publicLegalModelLabel(model) {
    return model === "association" ? "Associacao" : "SAF";
  }

  function publicReputationAverage(club) {
    const rep = club.publicReputation || {};
    return ((rep.institutional || 0) + (rep.financial || 0) + (rep.sporting || 0)) / 3;
  }

  function getBestLevelLabel(levels) {
    const ranked = levels.map((level) => LEVELS.find((item) => item.id === level)?.value || 0);
    const best = Math.max(0, ...ranked);
    return LEVELS.find((level) => level.value === best)?.label || "Inicial";
  }

  function getArquibancadaPosts() {
    const currentClub = getCurrentPublicClub();
    const relevant = state.events
      .map((event, index) => eventToPressPost(event, currentClub, index))
      .filter((post) => post.relevance >= 58);
    return [...getDemoArquibancadaPosts(), ...relevant]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 18);
  }

  function getMyClubPressPosts() {
    const currentClub = getCurrentPublicClub();
    return state.events.slice(0, 60).map((event, index) => ({
      ...eventToPressPost(event, currentClub, index, true),
      source: "Central interna do clube",
      relevanceLevel: "privado",
      clubs: [currentClub],
      targetView: pressTargetViewForEvent(event),
      targetRoute: VIEW_ROUTES[pressTargetViewForEvent(event)],
    }));
  }

  function getBallMarketPosts() {
    const currentClub = getCurrentPublicClub();
    const mine = state.events
      .filter((event) => event.type === "player" || event.type === "tryout")
      .map((event, index) => ({
        ...eventToPressPost(event, currentClub, index),
        source: "Mercado da Bola",
        category: event.type === "tryout" ? "Negociacoes em andamento" : "Transferencia concluida",
        relevance: 54,
        relevanceLevel: "moderado",
        clubs: [currentClub],
      }));
    const posts = [...getDemoTransferPosts(), ...mine].sort((a, b) => new Date(b.date) - new Date(a.date));
    const filter = state.press.transferFilter;
    if (filter === "mine") return posts.filter((post) => post.clubs.some((club) => club.id === "my-club"));
    if (filter === "followed") return posts.filter((post) => post.clubs.some((club) => state.press.followedClubIds.includes(club.id)));
    if (filter === "completed") return posts.filter((post) => post.category.includes("concluida"));
    if (filter === "negotiating") return posts.filter((post) => post.category.includes("andamento"));
    if (filter === "closed") return posts.filter((post) => post.category.includes("encerrada") || post.category.includes("recusada"));
    if (filter === "valuations") return posts.filter((post) => post.category.includes("Valorizacao"));
    if (filter === "expiring") return posts.filter((post) => post.category.includes("Contrato expirando"));
    return posts;
  }

  function getHorizonPosts() {
    const currentClub = getCurrentPublicClub();
    const notes = getAllPublishedCommunications().map((note, index) => communicationToPressPost(note, index));
    const posts = notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    const filter = state.press.horizonFilter || "city";
    if (filter === "city") return posts.filter((post) => post.clubs.some((club) => club.city === currentClub.city));
    if (filter === "state") return posts.filter((post) => post.clubs.some((club) => club.state === currentClub.state));
    if (filter === "national") return posts.filter((post) => post.scope === "national" || post.relevance >= 78);
    return posts.filter((post) => post.clubs.some((club) => club.state === currentClub.state) || post.scope === "region");
  }

  function getAllPublishedCommunications() {
    const currentClub = getCurrentPublicClub();
    const own = state.press.communications
      .filter((note) => note.status === "published")
      .map((note) => ({ ...note, club: currentClub }));
    return [...own, ...getDemoCommunications()];
  }

  function getPublishedCommunicationsForClub(club) {
    return getAllPublishedCommunications()
      .filter((note) => note.club.id === club.id)
      .sort((a, b) => new Date(b.publishAt) - new Date(a.publishAt));
  }

  function communicationToPressPost(note, index = 0) {
    const club = note.club || getCurrentPublicClub();
    return {
      source: "Jornal Horizonte",
      category: note.category,
      title: note.title,
      text: note.text,
      date: note.publishAt,
      reach: note.reach || 1200 + index * 140,
      impact: "publico",
      likes: 50 + index * 8,
      comments: 12 + index * 3,
      shares: 5 + index,
      tone: note.repercussion || "institucional",
      toneClass: note.impact?.institutional < 0 ? "warn" : "info",
      relevance: note.relevance || 55,
      relevanceLevel: relevanceLabel(note.relevance || 55),
      clubs: [club],
      scope: note.locality || "city",
    };
  }

  function eventToPressPost(event, club, index = 0, privatePost = false) {
    const relevance = privatePost ? 20 : calculateEventPressRelevance(event);
    return {
      source: privatePost ? "Meu Clube" : pressSourceForEvent(event, index),
      category: pressCategoryFromEvent(event),
      title: event.title,
      text: event.description,
      date: event.date,
      reach: Math.max(300, Math.round(700 + relevance * 34 + getReputationAverage() * 240)),
      impact: event.financialImpact > 0 ? "positivo" : event.financialImpact < 0 ? "alerta" : "moderado",
      likes: Math.round(20 + relevance * 1.6 + index * 3),
      comments: Math.round(5 + relevance * 0.45),
      shares: Math.round(2 + relevance * 0.18),
      tone: event.financialImpact < 0 ? "critico" : event.type === "promise" ? "institucional" : "informativo",
      toneClass: event.financialImpact < 0 ? "danger" : event.type === "promise" ? "info" : "good",
      relevance,
      relevanceLevel: relevanceLabel(relevance),
      clubs: [club],
    };
  }

  function calculateEventPressRelevance(event) {
    const absMoney = Math.abs(Number(event.financialImpact || 0));
    let score = 0;
    if (absMoney >= 120000) score += 45;
    else if (absMoney >= 50000) score += 32;
    else if (absMoney >= 20000) score += 18;
    if (event.type.includes("debt") || event.type.includes("municipal-grant")) score += 34;
    if (event.type.includes("sponsorship")) score += absMoney >= 50000 ? 38 : 14;
    if (event.type.includes("stadium")) score += 28;
    if (event.type.includes("ct") || event.title.toLowerCase().includes("ct")) score += 24;
    if (event.type.includes("player") && event.title.toLowerCase().includes("promovido")) score += 30;
    if (event.type.includes("promise") || event.type.includes("press-communication")) score += 22;
    if (event.type.includes("monthly-charge") || event.type.includes("staff-payroll")) score -= 40;
    if (event.type.includes("municipal-field")) score -= 30;
    return clamp(score, 0, 100);
  }

  function relevanceLabel(score) {
    if (score >= 92) return "historico";
    if (score >= 78) return "muito relevante";
    if (score >= 58) return "relevante";
    if (score >= 38) return "moderado";
    return "comum";
  }

  function pressCategoryFromEvent(event) {
    if (event.type.includes("sponsor")) return "Patrocinio";
    if (event.type.includes("staff")) return "Administrativo";
    if (event.type.includes("municipal")) return "Municipal";
    if (event.type.includes("stadium") || event.type.includes("ct") || event.type.includes("construction")) return "Construcao";
    if (event.type.includes("promise") || event.type.includes("press-communication")) return "Comunicado";
    if (event.type.includes("player") || event.type.includes("tryout")) return "Mercado da Bola";
    if (event.type.includes("debt")) return "Crise financeira";
    return "Clube";
  }

  function pressSourceForEvent(event, index) {
    const category = pressCategoryFromEvent(event);
    const sources = {
      "Mercado da Bola": "Mercado da Bola",
      Patrocinio: "Portal Regional Esportivo",
      Construcao: "Futebol Estadual Agora",
      Municipal: "Jornal Horizonte",
      Comunicado: "Jornal Horizonte",
      "Crise financeira": "Bastidores do Futebol",
      Administrativo: "Torcida em Foco",
    };
    return sources[category] || ["Bola em Rede", "Arquibancada FC", "Rede Nacional do Esporte"][index % 3];
  }

  function pressTargetViewForEvent(event) {
    if (event.type.includes("debt") || event.type.includes("municipal-grant") || event.type.includes("monthly-charge")) return "finances";
    if (event.type.includes("staff")) return "staff";
    if (event.type.includes("player") || event.type.includes("tryout")) return "marketTryouts";
    if (event.type.includes("stadium") || event.type.includes("ct") || event.type.includes("construction") || event.type.includes("land") || event.type.includes("admin-room")) return "installations";
    if (event.type.includes("sponsorship")) return "sponsorship";
    return "calendarCompleted";
  }

  function getDemoArquibancadaPosts() {
    const clubs = getDemoPublicClubs();
    return [
      {
        source: "Bola em Rede",
        category: "Categoria de base",
        title: "Promessa de 16 anos chama atencao apos subir ao profissional",
        text: "O jovem atacante Lucas Martins foi promovido apos se destacar na categoria de base.",
        date: addMinutes(Clock.iso(), -14),
        reach: 18400,
        impact: "positivo",
        likes: 1240,
        comments: 188,
        shares: 76,
        tone: "empolgado",
        toneClass: "good",
        relevance: 82,
        relevanceLevel: "muito relevante",
        clubs: [clubs[0]],
      },
      {
        source: "Futebol Estadual Agora",
        category: "Infraestrutura",
        title: "Aurora Litoranea inaugura modulo moderno de estadio",
        text: "O clube apresentou uma ampliacao que aumenta a visibilidade da SAF no litoral.",
        date: addDays(Clock.iso(), -2),
        reach: 22100,
        impact: "institucional",
        likes: 1620,
        comments: 230,
        shares: 91,
        tone: "destaque",
        toneClass: "info",
        relevance: 86,
        relevanceLevel: "muito relevante",
        clubs: [clubs[2]],
      },
    ];
  }

  function getDemoTransferPosts() {
    const clubs = getAllPublicClubs();
    return [
      {
        source: "Mercado da Bola",
        category: "Transferencia concluida",
        title: "Uniao Central confirma chegada de Joao Silva",
        text: "Meia de 20 anos troca de clube em transferencia publica entre diretorias humanas simuladas.",
        date: addDays(Clock.iso(), -1),
        reach: 7600,
        impact: "esportivo",
        likes: 420,
        comments: 65,
        shares: 18,
        tone: "informativo",
        toneClass: "info",
        relevance: 56,
        relevanceLevel: "moderado",
        clubs: [clubs[1], clubs[2]],
      },
      {
        source: "Mercado da Bola",
        category: "Negociacoes em andamento",
        title: "#atleticodovale inicia negociacao por atacante jovem",
        text: "O clube busca reforco ofensivo, mas detalhes de salario e bonus permanecem privados.",
        date: addDays(Clock.iso(), -3),
        reach: 5400,
        impact: "moderado",
        likes: 260,
        comments: 42,
        shares: 12,
        tone: "rumor",
        toneClass: "warn",
        relevance: 48,
        relevanceLevel: "moderado",
        clubs: [clubs[1]],
      },
      {
        source: "Mercado da Bola",
        category: "Valorizacao",
        title: "Lucas Martins valoriza acima de 50% em 30 dias",
        text: "Percentual, idade e potencial tornaram a valorizacao relevante para a rede.",
        date: addDays(Clock.iso(), -5),
        reach: 11300,
        impact: "positivo",
        likes: 720,
        comments: 88,
        shares: 35,
        tone: "destaque",
        toneClass: "good",
        relevance: 74,
        relevanceLevel: "relevante",
        clubs: [clubs[1]],
      },
    ];
  }

  function getDemoHorizonPosts() {
    return getDemoCommunications().map((note, index) => communicationToPressPost(note, index));
  }

  function getDemoCommunications() {
    const clubs = getDemoPublicClubs();
    return [
      {
        id: "demo-note-1",
        title: "Atletico do Vale anuncia projeto social com atletas da cidade",
        text: "O clube informou que iniciara atividades comunitarias nas proximas semanas.",
        category: "Comunicado institucional",
        publishAt: addDays(Clock.iso(), -4),
        author: "Presidencia",
        status: "published",
        locality: "city",
        reach: 3200,
        repercussion: "positiva",
        impact: { institutional: 0.04, financial: 0, sporting: 0 },
        relevance: 52,
        club: clubs[0],
      },
      {
        id: "demo-note-2",
        title: "Aurora Litoranea apresenta patrocinio regional",
        text: "A SAF divulgou acordo comercial e ampliacao das acoes de marca no litoral.",
        category: "Anuncio de patrocinio",
        publishAt: addDays(Clock.iso(), -6),
        author: "Diretoria da SAF",
        status: "published",
        locality: "state",
        reach: 8700,
        repercussion: "comercial",
        impact: { institutional: 0.03, financial: 0.05, sporting: 0 },
        relevance: 72,
        club: clubs[2],
      },
    ];
  }

  function getPublicClubPosts(club) {
    return [
      ...getArquibancadaPosts(),
      ...getHorizonPosts(),
      ...getBallMarketPosts(),
    ].filter((post) => (post.clubs || []).some((item) => item.id === club.id));
  }

  function searchPublicClubs() {
    const query = normalizeText(state.press.clubSearch || "");
    const clubs = getAllPublicClubs();
    if (!query) return clubs;
    return clubs.filter((club) => {
      const haystack = normalizeText([
        club.fullName,
        club.shortName,
        club.acronym,
        club.city,
        club.state,
        club.hashtag,
        club.stadium.name,
        publicLegalModelLabel(club.legalModel),
      ].join(" "));
      return haystack.includes(query.replace(/^#/, ""));
    });
  }

  function communicationStatusLabel(status) {
    return { draft: "Rascunho", scheduled: "Agendado", published: "Publicado", withdrawn: "Retirado" }[status] || "Publicado";
  }

  function communicationStatusTone(status) {
    return { draft: "warn", scheduled: "info", published: "good", withdrawn: "danger" }[status] || "good";
  }

  function renderSquadTabs() {
    const availableTabs = getFilteredNavItems(SQUAD_NAV_ITEMS);
    if (!availableTabs.some((item) => item.view === currentView) && ["youth", "squadMedical"].includes(currentView)) {
      currentView = "squad";
    }
    return renderSecondaryNav(SQUAD_NAV_ITEMS, "Navegacao interna de Elenco");
  }

  function renderSquadTraining() {
    return `
      ${renderSquadTabs()}
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header"><div><h2>Programa&ccedil;&atilde;o semanal</h2><p>Treinos internos simples enquanto o modulo esportivo completo nao existe.</p></div></div>
          <div class="table-list">
            ${["Preparacao fisica", "Treino tecnico", "Treino tatico", "Descanso ativo", "Treino individual"].map((item, index) => `
              <div class="record row">
                <div>
                  <div class="record-title">${item}</div>
                  <div class="record-meta">Intensidade ${index === 3 ? "baixa" : index === 2 ? "alta" : "media"} &middot; Uso de instalacao: ${hasCtSignal() ? "CT" : state.facilities.municipalField?.active ? "Campo municipal" : "estrutura improvisada"}</div>
                </div>
                <span class="badge">${["Seg", "Ter", "Qua", "Qui", "Sex"][index]}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Condi&ccedil;&atilde;o do elenco</h2><p>Indicadores provis&oacute;rios.</p></div></div>
          <div class="asset-map">
            <div class="asset-tile"><span>Atletas</span><strong>${state.players.squad.length}</strong><em>Plantel principal</em></div>
            <div class="asset-tile"><span>Base</span><strong>${state.players.youth.length}</strong><em>Jovens disponiveis</em></div>
            <div class="asset-tile"><span>Estrutura</span><strong>${hasCtSignal() ? "CT" : "Municipal"}</strong><em>Teto de aproveitamento</em></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderSquadMedical() {
    const medicalStaff = getActiveStaff().filter((employee) => employee.groupId === "medical");
    return `
      ${renderSquadTabs()}
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header"><div><h2>Departamento m&eacute;dico</h2><p>Disponivel por estrutura medica ou profissionais contratados.</p></div></div>
          ${medicalStaff.length ? renderStaffEmployeeList(medicalStaff, true) : empty("Nenhum profissional medico contratado.")}
        </div>
        <div class="panel">
          <div class="panel-header"><div><h2>Atletas lesionados</h2><p>Sistema avancado de lesoes ainda nao implementado.</p></div></div>
          <div class="notice">Sem lesoes registradas no prototipo. A area ja esta posicionada para diagnosticos, prazos e prevencao.</div>
        </div>
      </section>
    `;
  }

  function renderSquadInternal() {
    return `
      ${renderSquadTabs()}
      <section class="view-grid">
        ${renderInternalTrainingPanel()}
        <div class="panel">
          <div class="panel-header"><div><h2>Hist&oacute;rico de jogos internos</h2><p>Treinos reduzidos e jogos-treino completos.</p></div></div>
          ${renderEventsList(state.events.filter((event) => event.type === "training-match").slice(0, 10), true)}
        </div>
      </section>
    `;
  }

  function renderMarketPlayers() {
    return `
      ${renderSecondaryNav(MARKET_NAV_ITEMS, "Navegacao interna de Mercado")}
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header"><div><h2>Jogadores dispon&iacute;veis</h2><p>Nao ha clubes controlados por IA; aqui aparecem apenas atletas sem contrato do prototipo.</p></div></div>
          ${renderPlayerList(state.players.tryoutFindings, "tryout")}
        </div>
        <div class="panel">
          <div class="panel-header"><div><h2>Elenco contratado</h2><p>Historico simples de entradas vindas de peneiras ou base.</p></div></div>
          ${renderPlayerList(state.players.squad, "squad")}
        </div>
      </section>
    `;
  }

  function renderMarketObservation() {
    const scouts = getActiveStaff().filter((employee) => ["scout", "chief-scout"].includes(employee.roleId));
    return `
      ${renderSecondaryNav(MARKET_NAV_ITEMS, "Navegacao interna de Mercado")}
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header"><div><h2>Observa&ccedil;&atilde;o</h2><p>Olheiros contratados influenciam a qualidade futura dos relatorios.</p></div></div>
          ${scouts.length ? renderStaffEmployeeList(scouts, true) : `<div class="notice warn">Nenhum olheiro contratado. Busque profissionais em Escrit&oacute;rio &gt; Funcion&aacute;rios.</div>`}
        </div>
        <div class="panel">
          <div class="panel-header"><div><h2>Lista de interesses</h2><p>Atletas encontrados e ainda nao contratados.</p></div></div>
          ${renderPlayerList(state.players.tryoutFindings, "tryout")}
        </div>
      </section>
    `;
  }

  function renderMarketTryouts() {
    return `
      ${renderSecondaryNav(MARKET_NAV_ITEMS, "Navegacao interna de Mercado")}
      <section class="view-grid">
        ${renderTryoutPanel()}
        <div class="panel">
          <div class="panel-header"><div><h2>Atletas encontrados</h2><p>Contrate, descarte futuramente ou encaminhe para a base.</p></div></div>
          ${renderPlayerList(state.players.tryoutFindings, "tryout")}
        </div>
      </section>
    `;
  }

  function renderMarketRealEstate() {
    return `
      ${renderSecondaryNav(MARKET_NAV_ITEMS, "Navegacao interna de Mercado")}
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Mercado de im&oacute;veis</h2><p>Ofertas ficticias de salas e terrenos nesta etapa.</p></div></div>
          <div class="split">
            ${renderContextCard({ title: "Salas administrativas", text: "Comprar ou alugar salas externas com prazo de 24 horas.", actionLabel: "Abrir salas", view: "rooms", route: "/escritorio/instalacoes/salas" })}
            ${renderContextCard({ title: "Terrenos", text: "Escolher localizacao, area e registrar patrimonio.", actionLabel: "Abrir terrenos", view: "land", route: "/escritorio/instalacoes/terrenos" })}
          </div>
        </div>
      </section>
      ${renderRooms()}
      ${renderLand()}
    `;
  }

  function renderMarketHistory() {
    const marketEvents = state.events.filter((event) =>
      ["player", "tryout", "land", "admin-room", "staff", "sponsorship"].some((type) => event.type.includes(type))
    );
    return `
      ${renderSecondaryNav(MARKET_NAV_ITEMS, "Navegacao interna de Mercado")}
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Hist&oacute;rico do mercado</h2><p>Contratacoes, imoveis, propostas e negociacoes canceladas.</p></div></div>
          ${renderEventsList(marketEvents, true)}
        </div>
      </section>
    `;
  }

  function renderCalendar(activeTab) {
    const content = {
      agenda: renderCalendarAgenda,
      upcoming: renderCalendarUpcoming,
      completed: renderCalendarCompleted,
      schedules: renderCalendarSchedules,
      alerts: renderCalendarAlerts,
    }[activeTab] || renderCalendarAgenda;
    return `${renderSecondaryNav(CALENDAR_NAV_ITEMS, "Navegacao interna de Calendario")}${content()}`;
  }

  function renderCalendarAgenda() {
    const upcoming = getUpcomingEventItems();
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header"><div><h2>Agenda</h2><p>Eventos ordenados por data real.</p></div></div>
          ${upcoming.length ? renderUpcomingEvents() : empty("Nenhum evento futuro registrado.")}
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Hoje</h2><p>Relogio oficial do jogo.</p></div></div>
          <div class="asset-map">
            <div class="asset-tile"><span>Agora</span><strong>${formatDate(Clock.iso())}</strong><em>Tempo real 1:1</em></div>
            <div class="asset-tile"><span>Eventos futuros</span><strong>${upcoming.length}</strong><em>Inclui obras e vencimentos</em></div>
          </div>
        </div>
      </section>
    `;
  }

  function renderCalendarUpcoming() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Pr&oacute;ximos eventos</h2><p>Conclusoes, vencimentos, pagamentos e propostas expirando.</p></div></div>
          ${renderUpcomingEvents()}
        </div>
      </section>
    `;
  }

  function renderCalendarCompleted() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Eventos conclu&iacute;dos</h2><p>Historico geral do clube.</p></div></div>
          ${renderEventsList(state.events, true)}
        </div>
      </section>
    `;
  }

  function renderCalendarSchedules() {
    const payroll = getNextStaffPayrollAt();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Programa&ccedil;&otilde;es</h2><p>Agenda simples para compromissos recorrentes.</p></div></div>
          <div class="table-list">
            ${renderContextCard({ title: "Treinamentos semanais", text: hasCtSignal() ? "Usando estrutura do clube." : "Usando campo municipal ou estrutura improvisada.", actionLabel: "Ver treinos", view: "squadTraining" })}
            ${renderContextCard({ title: "Pagamento de sal&aacute;rios", text: payroll ? `Proxima folha em ${formatDate(payroll)}.` : "Sem funcionarios ativos na folha.", actionLabel: "Ver finan&ccedil;as", view: "finances" })}
            ${renderContextCard({ title: "Comunicados oficiais", text: "Promessas e posicionamentos publicos podem ser publicados na Imprensa.", actionLabel: "Publicar", view: "pressCommunications" })}
          </div>
        </div>
      </section>
    `;
  }

  function renderCalendarAlerts() {
    const alerts = getImportantAlerts();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Alertas</h2><p>Riscos financeiros, estruturais e de prazo.</p></div></div>
          ${alerts.length ? `<div class="table-list">${alerts.map((alert) => `<div class="notice ${alert.tone}">${alert.text}</div>`).join("")}</div>` : empty("Nenhum alerta critico no momento.")}
        </div>
      </section>
    `;
  }

  function renderOverview() {
    const works = getActiveConstructions();
    const contracts = state.sponsorships.contracts.filter((contract) => contract.status === "active");
    const expenses = getMonthlyExpenseTotal();
    const upcoming = getUpcomingEventItems();
    const offline = state.offlineReport && !state.offlineReport.seen ? renderOfflineReport() : "";
    return `
      ${offline}
      <section class="metric-grid">
        <div class="metric"><span>Caixa dispon&iacute;vel</span><strong class="${state.finance.cash < 0 ? "money-minus" : ""}">${money(state.finance.cash)}</strong><em>Saldo persistente salvo no localStorage.</em></div>
        <div class="metric"><span>Receita do m&ecirc;s</span><strong class="money-plus">${money(getRecentRevenue())}</strong><em>Entradas registradas nos ultimos 30 dias.</em></div>
        <div class="metric"><span>Despesa do m&ecirc;s</span><strong class="money-minus">${money(getRecentExpense())}</strong><em>Saidas registradas nos ultimos 30 dias.</em></div>
        <div class="metric"><span>Custo mensal previsto</span><strong>${money(expenses)}</strong><em>${getMonthlyExpenses().length} item(ns) recorrente(s).</em></div>
        <div class="metric"><span>Patrim&ocirc;nio total</span><strong>${money(getPropertyValue())}</strong><em>Bens comprados e obras concluidas.</em></div>
        <div class="metric"><span>Atletas</span><strong>${state.players.squad.length}</strong><em>${state.players.youth.length} jovem(ns) na base.</em></div>
        <div class="metric"><span>Funcion&aacute;rios</span><strong>${getActiveStaff().length}</strong><em>Capacidade admin.: ${getOfficeRequiredStaffCount()}/${getAdminCapacity()}.</em></div>
        <div class="metric"><span>Pr&oacute;ximo evento</span><strong>${upcoming[0] ? escapeHtml(upcoming[0].type) : "Nenhum"}</strong><em>${upcoming[0] ? `${escapeHtml(upcoming[0].title)} - ${formatDate(upcoming[0].date)}` : "Sem vencimentos futuros."}</em></div>
        <div class="metric"><span>Obras em andamento</span><strong>${works.length}</strong><em>Conclusao automatica por data real.</em></div>
        <div class="metric"><span>Contratos ativos</span><strong>${contracts.length}</strong><em>Patrocinios vigentes.</em></div>
      </section>

      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header">
            <div><h2>Clube</h2><p>Identidade e situacao inicial.</p></div>
            <span class="badge info">${legalModelLabel()}</span>
          </div>
          <div class="split">
            <div class="record">
              <div class="record-title">${crestMarkup(state.club)} ${escapeHtml(state.club.fullName)}</div>
              <div class="record-meta">Fundado em ${formatDate(state.club.foundedAt)} em ${escapeHtml(state.club.city)}. Mascote: ${escapeHtml(state.club.mascot)}.</div>
            </div>
            <div class="record">
              <div class="record-title">${jerseyMarkup(state.club)} Uniforme</div>
              <div class="record-meta">Padrao visual simples para a primeira etapa do prototipo.</div>
            </div>
          </div>
        </div>

        <div class="panel third">
          <div class="panel-header">
            <div><h2>Reputa&ccedil;&otilde;es</h2><p>Escala de 0 a 10.</p></div>
          </div>
          <div class="stack">
            ${renderReputationBars()}
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Obras em andamento</h2><p>Prazos com relogio real.</p></div>
          </div>
          ${works.length ? renderConstructionList(works) : empty("Nenhuma obra em andamento.")}
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Contratos ativos</h2><p>Patrocinios aceitos.</p></div>
          </div>
          ${contracts.length ? renderContractList(contracts) : empty("Nenhum contrato ativo.")}
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Proximos eventos</h2><p>Vencimentos e cobrancas.</p></div>
          </div>
          ${renderUpcomingEvents()}
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Notifica&ccedil;&otilde;es</h2><p>Ultimos acontecimentos do clube.</p></div>
          </div>
          ${renderEventsList(state.events.slice(0, 5))}
        </div>

        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Alertas importantes</h2><p>O que exige atencao primeiro.</p></div>
          </div>
          ${getImportantAlerts().length ? `<div class="table-list">${getImportantAlerts().slice(0, 6).map((alert) => `<div class="notice ${alert.tone}">${alert.text}</div>`).join("")}</div>` : empty("Nenhum alerta critico no momento.")}
        </div>
      </section>
    `;
  }

  function renderOfflineReport() {
    const report = state.offlineReport;
    return `
      <section class="notice">
        <div class="panel-header">
          <div>
            <strong>Relatorio do periodo offline</strong>
            <p>De ${report.from ? formatDate(report.from) : "registro anterior"} ate ${formatDate(report.to)}.</p>
          </div>
          <button class="button small" data-action="dismiss-offline-report">Ok</button>
        </div>
        <div class="table-list">
          ${report.items.map((item) => `<div class="record-meta">${escapeHtml(item)}</div>`).join("")}
        </div>
      </section>
    `;
  }

  function renderFoundation() {
    const isAssociation = state.club.legalModel === "association";
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Modelo juridico</h2><p>Regras aplicadas nesta versao.</p></div>
            <span class="badge ${isAssociation ? "good" : "info"}">${legalModelLabel()}</span>
          </div>
          <div class="split">
            <div class="record">
              <div class="record-title">Associa&ccedil;&atilde;o</div>
              <div class="record-meta">Acesso a doacoes iniciais e verba municipal. Decisoes futuras passam por conselho e eleicoes.</div>
            </div>
            <div class="record">
              <div class="record-title">SAF</div>
              <div class="record-meta">Nao recebe doacoes nem verba municipal. Patrocinios aceitos recebem bonus de 30%.</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Doa&ccedil;&otilde;es iniciais</h2><p>Disponiveis uma unica vez para Associacao.</p></div>
            ${state.donations.confirmed ? '<span class="badge good">Confirmado</span>' : ""}
          </div>
          ${renderDonations(isAssociation)}
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Verba municipal</h2><p>Simulacao do compromisso de atletas da cidade.</p></div>
            ${grantStatusBadge()}
          </div>
          ${renderMunicipalGrant(isAssociation)}
        </div>

        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Declara&ccedil;&otilde;es publicas</h2><p>Promessas registradas para comparacao futura entre discurso e acao.</p></div>
          </div>
          <form id="promise-form" class="form-grid">
            <label class="field">Canal
              <select name="channel">
                <option>Comunicado oficial</option>
                <option>Entrevista</option>
                <option>Coletiva</option>
                <option>Jornal municipal</option>
                <option>Jornal regional</option>
                <option>Jornal estadual</option>
                <option>Jornal nacional</option>
              </select>
            </label>
            <label class="field full">Promessa
              <textarea name="text" required maxlength="240" placeholder="Ex.: priorizar atletas da base nas primeiras temporadas"></textarea>
            </label>
            <div class="field full">
              <button class="button primary" type="submit">Registrar promessa</button>
            </div>
          </form>
          <div class="table-list" style="margin-top:14px">
            ${state.promises.length ? state.promises.map((promise) => `
              <div class="record row">
                <div>
                  <div class="record-title">${escapeHtml(promise.channel)}</div>
                  <div class="record-meta">${escapeHtml(promise.text)} &middot; ${formatDate(promise.date)}</div>
                </div>
                <span class="badge info">${promise.status}</span>
              </div>
            `).join("") : empty("Nenhuma promessa ativa.")}
          </div>
        </div>
      </section>
    `;
  }

  function renderDonations(isAssociation) {
    if (!isAssociation) {
      return `<div class="notice warn">SAF nao recebe doacoes iniciais nesta regra.</div>`;
    }
    if (state.donations.confirmed) {
      const total = state.donations.acceptedIds.reduce((sum, id) => sum + (DONATIONS.find((item) => item.id === id)?.amount || 0), 0);
      return `<div class="notice">Doacoes aceitas: ${money(total)}. Este recurso nao pode ser solicitado novamente.</div>`;
    }
    return `
      <form id="donations-form">
        <div class="checkbox-list">
          ${DONATIONS.map((donation) => `
            <label class="check-row">
              <input type="checkbox" name="donations" value="${donation.id}" />
              <span>${escapeHtml(donation.name)}</span>
              <strong>${money(donation.amount)}</strong>
            </label>
          `).join("")}
        </div>
        <div class="total-strip">
          <span>Total selecionado</span>
          <strong id="donation-total">${money(0)}</strong>
        </div>
        <div class="button-row">
          <button class="button primary" type="submit">Confirmar doa&ccedil;&otilde;es</button>
        </div>
      </form>
    `;
  }

  function grantStatusBadge() {
    const status = state.municipalGrant.status;
    const map = {
      not_requested: ["Nao solicitada", ""],
      requested: ["Solicitada", "info"],
      accepted: ["Compromisso ativo", "warn"],
      review_due: ["Em revisao", "warn"],
      fulfilled: ["Cumprida", "good"],
      debt_active: ["Divida ativa", "danger"],
      installment: ["Parcelada", "warn"],
    };
    const [label, tone] = map[status] || ["Status indefinido", ""];
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function renderMunicipalGrant(isAssociation) {
    const grant = state.municipalGrant;
    if (!isAssociation) return `<div class="notice warn">SAF nao recebe verba municipal.</div>`;

    if (grant.status === "not_requested") {
      return `<button class="button primary" data-action="request-grant">Solicitar verba municipal</button>`;
    }
    if (grant.status === "requested") {
      return `
        <div class="notice">Valor aprovado para aceite: <strong>${money(28764.3)}</strong>. O compromisso simulado dura 2 meses.</div>
        <div class="button-row">
          <button class="button primary" data-action="accept-grant">Aceitar verba</button>
        </div>
      `;
    }
    if (grant.status === "accepted" || grant.status === "review_due") {
      return `
        <div class="stack">
          <div class="record">
            <div class="record-title">Compromisso municipal</div>
            <div class="record-meta">Usar pelo menos 6 atletas naturais da cidade por periodo minimo de 2 meses. No prototipo, o prazo foi iniciado no aceite.</div>
            <div class="status-line">
              <span class="badge warn">Prazo: ${formatDate(grant.deadlineAt)}</span>
              <span class="badge" data-countdown="${grant.deadlineAt}">${remainingTime(grant.deadlineAt)}</span>
            </div>
          </div>
          <div class="button-row">
            <button class="button primary" data-action="fulfill-grant">Simular cumprimento</button>
            <button class="button danger" data-action="default-grant">Simular descumprimento</button>
          </div>
        </div>
      `;
    }
    if (grant.status === "fulfilled") {
      return `<div class="notice">Compromisso marcado como cumprido. Nenhuma divida municipal ativa.</div>`;
    }
    return `
      <div class="stack">
        <div class="notice danger">
          Divida atual: <strong>${money(grant.debt)}</strong>. Juros de 5% ao dia. ${grant.financialBlocked ? "Risco de bloqueio financeiro ativo." : "Bloqueio financeiro pode ocorrer apos 3 semanas."}
        </div>
        ${grant.installmentPlan ? renderGrantInstallments() : `<button class="button warn" data-action="parcel-grant">Simular parcelamento</button>`}
      </div>
    `;
  }

  function renderGrantInstallments() {
    const plan = state.municipalGrant.installmentPlan;
    return `
      <div class="table-list">
        ${plan.installments.map((installment, index) => `
          <div class="record row">
            <div>
              <div class="record-title">Parcela ${index + 1}</div>
              <div class="record-meta">Vencimento: ${formatDate(installment.dueAt)} &middot; Valor base: ${money(installment.amount)}</div>
            </div>
            ${installment.paid ? '<span class="badge good">Paga</span>' : `<button class="button small primary" data-action="pay-grant-parcel" data-id="${installment.id}">Pagar</button>`}
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderFinances() {
    const expenses = getMonthlyExpenses();
    const financeEvents = state.events.filter((event) => Number(event.financialImpact) !== 0).slice(0, 20);
    return `
      <section class="metric-grid">
        <div class="metric"><span>Caixa</span><strong class="${state.finance.cash < 0 ? "money-minus" : ""}">${money(state.finance.cash)}</strong><em>Entrada e saida local.</em></div>
        <div class="metric"><span>Despesa mensal prevista</span><strong>${money(getMonthlyExpenseTotal())}</strong><em>${expenses.length} item(ns) recorrente(s).</em></div>
        <div class="metric"><span>Patrimonio</span><strong>${money(getPropertyValue())}</strong><em>Sem contar alugueis.</em></div>
        <div class="metric"><span>Divida municipal</span><strong>${money(state.municipalGrant.debt || 0)}</strong><em>Juros diarios quando ativa.</em></div>
      </section>
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Despesas mensais</h2><p>Manutencao separada por bem, sem duplicar terreno dentro da construcao.</p></div>
          </div>
          ${expenses.length ? `
            <div class="table-list">
              ${expenses.map((row) => `
                <div class="record row">
                  <div>
                    <div class="record-title">${escapeHtml(row.label)}</div>
                    <div class="record-meta">${escapeHtml(row.type)} &middot; Proxima cobranca: ${formatDate(row.nextChargeAt)}</div>
                  </div>
                  <strong>${money(row.amount)}</strong>
                </div>
              `).join("")}
            </div>
          ` : empty("Nenhuma despesa mensal recorrente.")}
        </div>
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Historico financeiro</h2><p>Doacoes, patrocinios, compras, alugueis, obras e cobrancas.</p></div>
          </div>
          ${renderEventsList(financeEvents, true)}
        </div>
      </section>
    `;
  }

  function renderReputation() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Indicadores</h2><p>As propostas comerciais usam principalmente reputacao institucional e financeira.</p></div>
            <span class="badge info">Media ${number(getReputationAverage(), 2)}</span>
          </div>
          <div class="stack">${renderReputationBars()}</div>
        </div>
        ${Object.entries(state.reputations).map(([key, rep]) => `
          <div class="panel third">
            <div class="panel-header"><div><h2>${reputationName(key)}</h2><p>Historico de alteracoes.</p></div></div>
            <div class="timeline">
              ${rep.history.slice(0, 8).map((item) => `
                <div class="event-row">
                  <span class="event-dot"></span>
                  <div class="event-content">
                    <strong>${number(item.value, 2)}</strong>
                    <span>${formatDate(item.date)} &middot; ${escapeHtml(item.reason)}</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }

  function renderReputationBars() {
    return Object.entries(state.reputations).map(([key, rep]) => {
      const level = reputationLevel(rep.value);
      return `
        <div class="stat-row">
          <strong>${reputationName(key)}</strong>
          <div class="progress"><span style="width:${clamp(rep.value * 10, 0, 100)}%"></span></div>
          <span class="badge ${level.tone}">${number(rep.value, 2)} ${level.label}</span>
        </div>
      `;
    }).join("");
  }

  function reputationName(key) {
    return {
      institutional: "Institucional",
      financial: "Financeira",
      sporting: "Esportiva",
    }[key] || key;
  }

  function renderSponsorship() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Criar cota</h2><p>A aceitacao usa valor estimado, reputacao e regras rigidas de corte.</p></div>
            ${state.club.legalModel === "saf" ? '<span class="badge good">Bonus SAF +30%</span>' : ""}
          </div>
          <form id="sponsor-quota-form" class="form-grid three">
            <label class="field">Nome da cota
              <input name="name" required maxlength="48" placeholder="Master 2026" />
            </label>
            <label class="field">Posicao
              <select name="position" required>
                ${SPONSOR_POSITIONS.map((position) => `
                  <option value="${position.id}" ${isSponsorPositionAvailable(position) ? "" : "disabled"}>${position.label}${position.requires ? " - exige instalacao" : ""}</option>
                `).join("")}
              </select>
            </label>
            <label class="field">Quantidade
              <input name="quantity" type="number" min="1" max="20" value="1" required />
            </label>
            <label class="field">Valor pedido
              <input name="askValue" type="number" min="100" step="0.01" value="15000" required />
            </label>
            <label class="field">Duracao (meses)
              <input name="durationMonths" type="number" min="1" max="60" value="12" required />
            </label>
            <label class="field">Exclusividade
              <select name="exclusive">
                <option value="no">Sem exclusividade</option>
                <option value="yes">Exclusiva por segmento</option>
              </select>
            </label>
            <label class="field full">Metas obrigatorias
              <textarea name="mandatoryGoals" placeholder="Ex.: publicacoes mensais, marca em todos os jogos"></textarea>
            </label>
            <label class="field">Metas bonus
              <input name="bonusGoals" placeholder="Ex.: publico minimo" />
            </label>
            <label class="field">Penalidades
              <input name="penalties" placeholder="Ex.: desconto por atraso" />
            </label>
            <div class="field full">
              <div class="total-strip">
                <span>Valor estimado do mercado</span>
                <strong id="sponsor-estimate">${money(0)}</strong>
              </div>
              <div class="button-row">
                <button class="button primary" type="submit">Criar cota</button>
              </div>
            </div>
          </form>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Cotas criadas</h2><p>Gere empresas ficticias para testar propostas.</p></div>
          </div>
          ${renderQuotaList()}
        </div>

        <div class="panel">
          <div class="panel-header">
            <div><h2>Propostas</h2><p>Ofertas expiram em 7 dias reais.</p></div>
          </div>
          ${renderProposalList()}
        </div>

        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Contratos ativos</h2><p>Valores aceitos entram no caixa imediatamente nesta versao.</p></div>
          </div>
          ${renderContractList(state.sponsorships.contracts)}
        </div>
      </section>
    `;
  }

  function isSponsorPositionAvailable(position) {
    if (position.requires === "ct") return hasCtSignal();
    if (position.requires === "stadium") return hasStadiumSignal();
    return true;
  }

  function renderQuotaList() {
    const quotas = state.sponsorships.quotas;
    if (!quotas.length) return empty("Nenhuma cota criada.");
    return `<div class="table-list">
      ${quotas.map((quota) => `
        <div class="record">
          <div class="record-title">${escapeHtml(quota.name)} <span class="badge">${quota.remaining}/${quota.quantity}</span></div>
          <div class="record-meta">${escapeHtml(quota.positionLabel)} &middot; Pedido: ${money(quota.askValue)} &middot; ${quota.durationMonths} mes(es)</div>
          <div class="action-row">
            <button class="button small primary" data-action="generate-sponsor-proposals" data-id="${quota.id}" ${quota.remaining <= 0 ? "disabled" : ""}>Gerar empresas</button>
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function renderProposalList() {
    const proposals = state.sponsorships.proposals.slice(0, 14);
    if (!proposals.length) return empty("Nenhuma proposta simulada.");
    return `<div class="table-list">
      ${proposals.map((proposal) => `
        <div class="record">
          <div class="record-title">${escapeHtml(proposal.company)} ${proposalStatusBadge(proposal)}</div>
          <div class="record-meta">${escapeHtml(proposal.quotaName)} &middot; ${escapeHtml(proposal.interest)} &middot; ${proposal.reason}</div>
          <div class="record-meta">Estimado: ${money(proposal.estimatedValue)} &middot; Pedido: ${money(proposal.askValue)} &middot; Oferta: ${money(proposal.amount)}</div>
          <div class="status-line">
            ${proposal.status === "offered"
              ? `<span class="badge" data-countdown="${proposal.expiresAt}">${remainingTime(proposal.expiresAt)}</span>`
              : `<span class="badge">${formatDate(proposal.createdAt)}</span>`}
            ${proposal.status === "offered" ? `
              <button class="button small primary" data-action="accept-proposal" data-id="${proposal.id}">Aceitar</button>
              <button class="button small" data-action="reject-proposal" data-id="${proposal.id}">Rejeitar</button>
            ` : ""}
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function proposalStatusBadge(proposal) {
    const map = {
      offered: ["Proposta", "good"],
      rejected: ["Rejeitada", "danger"],
      expired: ["Expirada", "warn"],
      accepted: ["Aceita", "info"],
    };
    const [label, tone] = map[proposal.status] || ["Status", ""];
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function renderContractList(contracts) {
    const active = contracts.filter((contract) => contract.status === "active");
    if (!active.length) return empty("Nenhum contrato ativo.");
    return `<div class="table-list">
      ${active.map((contract) => `
        <div class="record row">
          <div>
            <div class="record-title">${escapeHtml(contract.company)} <span class="badge good">${money(contract.amount)}</span></div>
            <div class="record-meta">${escapeHtml(contract.quotaName)} &middot; ate ${formatDate(contract.endAt)}</div>
          </div>
          <span class="badge" data-countdown="${contract.endAt}">${remainingTime(contract.endAt)}</span>
        </div>
      `).join("")}
    </div>`;
  }

  function renderStaff() {
    if (!state.staff.market.length) seedStaffMarket(state);
    state.staff.activeTab = currentStaffTab;
    return `
      ${renderSecondaryNav(OFFICE_NAV_ITEMS, "Navegacao interna de Escritorio")}
      ${renderStaffTabs()}
      ${renderStaffTabContent()}
    `;
  }

  function renderOfficeNav() {
    return renderSecondaryNav(OFFICE_NAV_ITEMS, "Navegacao interna de Escritorio");
  }

  function renderStaffTabs() {
    return `
      <div class="tabs-row" aria-label="Abas de funcionarios">
        ${STAFF_TABS.map((tab) => `
          <button class="pill-button ${currentStaffTab === tab.id ? "active" : ""}" data-staff-tab="${tab.id}" data-route="${tab.route}">
            ${tab.label}
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderStaffTabContent() {
    const tabs = {
      overview: renderStaffOverview,
      search: renderStaffSearch,
      hiring: renderStaffHiring,
      team: renderStaffTeam,
      development: renderStaffDevelopment,
      org: renderStaffOrg,
      history: renderStaffHistory,
    };
    return (tabs[currentStaffTab] || renderStaffOverview)();
  }

  function renderStaffOverview() {
    const active = getActiveStaff();
    const vacant = getVacantStaffRoles();
    const expiring = getContractsExpiringSoon();
    const inDevelopment = getStaffInDevelopment();
    return `
      <section class="people-entry-band">
        <div>
          <span class="eyebrow">Gestao de pessoas</span>
          <h2>Personalidade, reunioes e desenvolvimento</h2>
          <p>Acompanhe satisfacao, confianca, cursos, promessas e orientacoes da equipe.</p>
        </div>
        <a class="button primary" href="/escritorio/inteligencia">Abrir Central de Pessoas</a>
      </section>
      <section class="metric-grid">
        <div class="metric"><span>Funcionarios ativos</span><strong>${active.length}</strong><em>${new Set(active.map((employee) => employee.roleId)).size} cargo(s) ocupados.</em></div>
        <div class="metric"><span>Folha mensal</span><strong>${money(getStaffPayrollTotal())}</strong><em>Entra nas despesas recorrentes.</em></div>
        <div class="metric"><span>Cargos vagos</span><strong>${vacant.length}</strong><em>Cargos essenciais ainda sem titular.</em></div>
        <div class="metric"><span>Contratos vencendo</span><strong>${expiring.length}</strong><em>Proximos 30 dias reais.</em></div>
        <div class="metric"><span>Capacidade das salas</span><strong>${getOfficeRequiredStaffCount()}/${getAdminCapacity()}</strong><em>${getUnseatedStaffCount()} funcionario(s) sem sala.</em></div>
        <div class="metric"><span>Eficiencia media</span><strong>${number(getStaffAverageEfficiency(), 1)}%</strong><em>${inDevelopment.length} profissional(is) em desenvolvimento.</em></div>
      </section>
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header">
            <div><h2>For&ccedil;a de trabalho</h2><p>Resumo por grupo profissional.</p></div>
            ${getUnseatedStaffCount() > 0 ? '<span class="badge danger">Sobrecarga administrativa</span>' : '<span class="badge good">Capacidade ok</span>'}
          </div>
          <div class="table-list">
            ${STAFF_GROUPS.map((group) => {
              const groupStaff = active.filter((employee) => employee.groupId === group.id);
              return `
                <div class="record row">
                  <div>
                    <div class="record-title">${group.label}</div>
                    <div class="record-meta">${groupStaff.length} funcionario(s) &middot; Folha: ${money(groupStaff.reduce((sum, employee) => sum + employee.salary, 0))}</div>
                  </div>
                  <span class="badge ${getGroupEfficiency(group.id) >= 65 ? "good" : getGroupEfficiency(group.id) >= 40 ? "info" : "warn"}">${number(getGroupEfficiency(group.id), 1)}%</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Alertas</h2><p>Riscos operacionais desta versao.</p></div></div>
          <div class="stack">
            ${getUnseatedStaffCount() > 0 ? `<div class="notice danger">${getUnseatedStaffCount()} funcionario(s) administrativo(s) ou estrategico(s) sem sala disponivel.</div>` : `<div class="notice">Nenhuma sobrecarga de sala administrativa.</div>`}
            ${vacant.length ? `<div class="notice warn">Cargos vagos: ${vacant.slice(0, 5).map((role) => role.label).join(", ")}${vacant.length > 5 ? "..." : ""}</div>` : `<div class="notice">Todos os cargos essenciais estao ocupados.</div>`}
            ${expiring.length ? `<div class="notice warn">${expiring.length} contrato(s) proximos do vencimento.</div>` : `<div class="notice">Sem contratos vencendo nos proximos 30 dias.</div>`}
          </div>
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Equipe atual</h2><p>Primeiros profissionais contratados pelo clube.</p></div></div>
          ${renderStaffEmployeeList(active.slice(0, 6), true)}
        </div>
      </section>
    `;
  }

  function renderStaffSearch() {
    const filters = state.staff.filters || {};
    const professionals = filterStaffMarket();
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Buscar profissionais</h2><p>Filtros basicos para o mercado simulado.</p></div></div>
          <form id="staff-filter-form" class="form-grid three">
            <label class="field">Nome
              <input name="name" value="${escapeHtml(filters.name || "")}" placeholder="Nome do profissional" />
            </label>
            <label class="field">Grupo
              <select name="group">
                <option value="">Todos</option>
                ${STAFF_GROUPS.map((group) => `<option value="${group.id}" ${filters.group === group.id ? "selected" : ""}>${group.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Funcao
              <select name="role">
                <option value="">Todas</option>
                ${staffRoleOptions(filters.role)}
              </select>
            </label>
            <label class="field">Nivel minimo
              <select name="level">
                <option value="">Qualquer</option>
                <option value="36" ${filters.level === "36" ? "selected" : ""}>Basico</option>
                <option value="52" ${filters.level === "52" ? "selected" : ""}>Regular</option>
                <option value="68" ${filters.level === "68" ? "selected" : ""}>Bom</option>
                <option value="82" ${filters.level === "82" ? "selected" : ""}>Excelente</option>
              </select>
            </label>
            <label class="field">Salario maximo
              <input name="maxSalary" type="number" min="0" step="100" value="${escapeHtml(filters.maxSalary || "")}" />
            </label>
            <label class="field">Cidade
              <input name="city" value="${escapeHtml(filters.city || "")}" placeholder="Cidade" />
            </label>
            <label class="field">Preferencia
              <select name="legalPreference">
                <option value="">Todas</option>
                <option value="association" ${filters.legalPreference === "association" ? "selected" : ""}>Associacao</option>
                <option value="saf" ${filters.legalPreference === "saf" ? "selected" : ""}>SAF</option>
                <option value="neutral" ${filters.legalPreference === "neutral" ? "selected" : ""}>Sem preferencia</option>
              </select>
            </label>
            <label class="field">Disponibilidade
              <select name="status">
                <option value="">Disponiveis e observados</option>
                <option value="shortlisted" ${filters.status === "shortlisted" ? "selected" : ""}>Lista de interesse</option>
                <option value="observed" ${filters.status === "observed" ? "selected" : ""}>Observados</option>
                <option value="rejected" ${filters.status === "rejected" ? "selected" : ""}>Rejeitados</option>
              </select>
            </label>
            <div class="field full">
              <div class="button-row">
                <button class="button primary" type="submit">Aplicar filtros</button>
                <button class="button" type="button" data-action="reset-staff-filters">Limpar filtros</button>
              </div>
            </div>
          </form>
        </div>
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Profissionais encontrados</h2><p>${professionals.length} resultado(s) no mercado local.</p></div>
            <button class="button small" data-action="refresh-staff-market">Gerar nova lista</button>
          </div>
          ${renderStaffProfessionalList(professionals)}
        </div>
      </section>
    `;
  }

  function renderStaffHiring() {
    const candidate = getSelectedStaffCandidate();
    const defaultRole = candidate?.primaryRoleId || STAFF_ROLE_CATALOG[0].id;
    const defaultSalary = candidate?.desiredSalary || staffRoleById(defaultRole)?.baseSalary || 3000;
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header"><div><h2>Enviar proposta</h2><p>A resposta considera reputacao, salario, estrutura, estabilidade e modelo juridico.</p></div></div>
          <form id="staff-proposal-form" class="form-grid three">
            <label class="field">Profissional
              <select name="professionalId" required>
                ${availableStaffCandidates().map((item) => `<option value="${item.id}" ${candidate?.id === item.id ? "selected" : ""}>${escapeHtml(item.name)} - ${escapeHtml(item.primaryRoleLabel)}</option>`).join("")}
              </select>
            </label>
            <label class="field">Cargo oferecido
              <select name="roleId">${staffRoleOptions(defaultRole)}</select>
            </label>
            <label class="field">Salario mensal
              <input name="salary" type="number" min="0" step="100" value="${Math.round(defaultSalary)}" required />
            </label>
            <label class="field">Duracao (meses)
              <input name="durationMonths" type="number" min="1" max="60" value="${candidate?.desiredMonths || 12}" required />
            </label>
            <label class="field">Bonus
              <input name="bonus" type="number" min="0" step="100" value="0" />
            </label>
            <label class="field">Multa de rescisao
              <input name="terminationPenalty" type="number" min="0" step="100" value="${Math.round(defaultSalary * 3)}" />
            </label>
            <label class="field">Estrutura disponivel
              <select name="structure">
                <option value="office">Sala administrativa</option>
                <option value="ct">Centro de treinamento</option>
                <option value="stadium">Estadio</option>
                <option value="remote">Sem estrutura dedicada</option>
              </select>
            </label>
            <label class="field">Data de inicio
              <input name="startAt" type="datetime-local" value="${toDateTimeLocal(Clock.iso())}" />
            </label>
            <label class="field full">Metas
              <textarea name="goals" placeholder="Ex.: estruturar departamento, reduzir erros, melhorar evolucao da base"></textarea>
            </label>
            <div class="field full">
              <div class="total-strip">
                <span>Analise preliminar</span>
                <strong id="staff-offer-preview">${candidate ? staffOfferPreview(candidate, defaultSalary, defaultRole) : "Sem candidato"}</strong>
              </div>
              <button class="button primary" type="submit" ${candidate ? "" : "disabled"}>Enviar proposta</button>
            </div>
          </form>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Candidato selecionado</h2><p>Dados para montar a proposta.</p></div></div>
          ${candidate ? renderStaffProfessionalList([candidate], true) : empty("Nenhum candidato disponivel.")}
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Propostas enviadas</h2><p>Aceites, recusas e contrapropostas simuladas.</p></div></div>
          ${renderStaffProposalList()}
        </div>
      </section>
    `;
  }

  function renderStaffTeam() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Equipe atual</h2><p>Contratos, desempenho, moral, carga e local de trabalho.</p></div>
            <span class="badge info">${money(getStaffPayrollTotal())}/mes</span>
          </div>
          ${renderStaffEmployeeList(getActiveStaff())}
        </div>
      </section>
    `;
  }

  function renderStaffDevelopment() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Desenvolvimento</h2><p>Cursos simples com prazo real e ganho estimado.</p></div>
            <span class="badge">${PROVISIONAL_STAFF_COURSE_DAYS} dias &middot; ${money(PROVISIONAL_STAFF_COURSE_COST)}</span>
          </div>
          ${getActiveStaff().length ? renderStaffEmployeeList(getActiveStaff(), false, true) : empty("Contrate funcionarios para iniciar desenvolvimento.")}
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Em andamento</h2><p>Eventos de desenvolvimento ativos.</p></div></div>
          ${state.staff.development.length ? `
            <div class="table-list">
              ${state.staff.development.map((item) => `
                <div class="record row">
                  <div>
                    <div class="record-title">${escapeHtml(item.employeeName)} <span class="badge ${item.status === "completed" ? "good" : "warn"}">${item.status === "completed" ? "Concluido" : "Em curso"}</span></div>
                    <div class="record-meta">${escapeHtml(item.areaLabel)} &middot; Proximo ganho: +${item.gain} &middot; Custo: ${money(item.cost)}</div>
                  </div>
                  ${item.status === "in_progress" ? `<span class="badge" data-countdown="${item.endAt}">${remainingTime(item.endAt)}</span>` : `<span class="badge">${formatDate(item.completedAt || item.endAt)}</span>`}
                </div>
              `).join("")}
            </div>
          ` : empty("Nenhum desenvolvimento em andamento.")}
        </div>
      </section>
    `;
  }

  function renderStaffOrg() {
    const presidentLabel = state.club.legalModel === "association" ? "Presidencia" : "Direcao da SAF";
    const departments = [
      { label: "Futebol", roles: ["football-director", "head-coach", "assistant-coach", "fitness-coach", "performance-analyst"] },
      { label: "Financeiro", roles: ["financial-director", "accountant", "lawyer"] },
      { label: "Marketing", roles: ["marketing-manager", "sponsor-manager", "press-officer"] },
      { label: "Medico", roles: ["doctor", "physiotherapist", "nutritionist", "psychologist"] },
      { label: "Base", roles: ["youth-coach", "scout", "chief-scout"] },
      { label: "Patrimonio", roles: ["property-manager", "facility-manager", "maintenance-staff"] },
      { label: "Administracao", roles: ["admin-manager", "admin-staff"] },
    ];
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Organograma</h2><p>Responsaveis, subordinacoes e cargos vagos por setor.</p></div></div>
          <div class="record">
            <div class="record-title">${presidentLabel}</div>
            <div class="record-meta">Topo administrativo do clube nesta etapa do prototipo.</div>
          </div>
          <div class="table-list" style="margin-top:12px">
            ${departments.map((department) => {
              const filled = department.roles.map((roleId) => getActiveStaff().find((employee) => employee.roleId === roleId)).filter(Boolean);
              const vacant = department.roles.map(staffRoleById).filter((role) => role && !filled.some((employee) => employee.roleId === role.id));
              return `
                <div class="record">
                  <div class="record-title">${department.label}</div>
                  <div class="record-meta">Responsaveis: ${filled.length ? filled.map((employee) => `${employee.name} (${employee.roleLabel})`).join(", ") : "nenhum"}</div>
                  <div class="record-meta">Cargos vagos: ${vacant.length ? vacant.map((role) => role.label).join(", ") : "nenhum"}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderStaffHistory() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Historico de funcionarios</h2><p>Contratacoes, cursos, evolucoes, demissoes e pagamentos.</p></div></div>
          ${renderStaffHistoryList(state.staff.history)}
        </div>
      </section>
    `;
  }

  function renderStaffProfessionalList(professionals, compact = false) {
    if (!professionals.length) return empty("Nenhum profissional encontrado.");
    return `<div class="table-list">
      ${professionals.map((professional) => {
        const level = staffLevelFromAttributes(professional.attributes);
        return `
          <div class="record">
            <div class="record-title">${escapeHtml(professional.name)} <span class="badge ${level.tone}">${level.label}</span> ${staffStatusBadge(professional.status)}</div>
            <div class="record-meta">${escapeHtml(professional.primaryRoleLabel)} &middot; ${escapeHtml(professional.groupLabel)} &middot; ${professional.age} anos &middot; ${escapeHtml(professional.city)}/${escapeHtml(professional.state)}</div>
            <div class="record-meta">Experiencia: ${professional.experience} ano(s) &middot; Reputacao: ${number(professional.reputation, 2)} &middot; Salario desejado: ${money(professional.desiredSalary)} &middot; Contrato: ${professional.desiredMonths} mes(es)</div>
            <div class="record-meta">Secundarias: ${professional.secondaryRoles.map(escapeHtml).join(", ") || "nenhuma"} &middot; ${staffPreferenceLabel(professional.legalPreference)}</div>
            <div class="record-meta">Exigencias: ${professional.demands.map(escapeHtml).join(", ") || "sem exigencias extras"}</div>
            ${compact ? "" : `
              <div class="action-row">
                <button class="button small" data-action="observe-professional" data-id="${professional.id}" ${professional.status === "hired" ? "disabled" : ""}>Observar</button>
                <button class="button small" data-action="shortlist-professional" data-id="${professional.id}" ${professional.status === "hired" ? "disabled" : ""}>Salvar interesse</button>
                <button class="button small primary" data-action="open-staff-proposal" data-id="${professional.id}" ${professional.status === "hired" || professional.status === "rejected" ? "disabled" : ""}>Fazer proposta</button>
                <button class="button small" data-action="remove-staff-interest" data-id="${professional.id}" ${["available", "hired"].includes(professional.status) ? "disabled" : ""}>Remover da lista</button>
                <button class="button small danger" data-action="reject-professional" data-id="${professional.id}" ${professional.status === "hired" ? "disabled" : ""}>Rejeitar</button>
              </div>
            `}
          </div>
        `;
      }).join("")}
    </div>`;
  }

  function staffStatusBadge(status) {
    const map = {
      available: ["Disponivel", "info"],
      observed: ["Observado", "warn"],
      shortlisted: ["Interesse", "good"],
      rejected: ["Rejeitado", "danger"],
      hired: ["Contratado", "good"],
    };
    const [label, tone] = map[status] || ["Mercado", ""];
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function renderStaffProposalList() {
    if (!state.staff.proposals.length) return empty("Nenhuma proposta enviada.");
    return `<div class="table-list">
      ${state.staff.proposals.map((proposal) => `
        <div class="record">
          <div class="record-title">${escapeHtml(proposal.professionalName)} ${staffProposalBadge(proposal.status)}</div>
          <div class="record-meta">${escapeHtml(proposal.roleLabel)} &middot; Salario: ${money(proposal.offer.salary)} &middot; Duracao: ${proposal.offer.durationMonths} mes(es)</div>
          <div class="record-meta">${escapeHtml(proposal.answer || proposal.reason || "Aguardando resposta.")}</div>
          <div class="status-line">
            ${proposal.status === "waiting" ? `<span class="badge" data-countdown="${proposal.expiresAt}">${remainingTime(proposal.expiresAt)}</span>` : `<span class="badge">${formatDate(proposal.createdAt)}</span>`}
            ${proposal.status === "counteroffer" ? `<button class="button small primary" data-action="accept-staff-counter" data-id="${proposal.id}">Aceitar contraproposta de ${money(proposal.counterSalary)}</button>` : ""}
            ${proposal.status === "waiting" ? `<button class="button small" data-action="resolve-staff-proposal" data-id="${proposal.id}">Resolver agora</button>` : ""}
            ${["waiting", "counteroffer"].includes(proposal.status) ? `<button class="button small danger" data-action="cancel-staff-proposal" data-id="${proposal.id}">Cancelar</button>` : ""}
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function staffProposalBadge(status) {
    const map = {
      accepted: ["Aceita", "good"],
      rejected: ["Recusada", "danger"],
      counteroffer: ["Contraproposta", "warn"],
      waiting: ["Mais tempo", "info"],
      cancelled: ["Cancelada", "danger"],
    };
    const [label, tone] = map[status] || ["Enviada", ""];
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function renderStaffEmployeeList(employees, compact = false, developmentMode = false) {
    if (!employees.length) return empty("Nenhum funcionario ativo.");
    return `<div class="table-list">
      ${employees.map((employee) => {
        const level = staffLevelFromAttributes(employee.attributes);
        const activeDevelopment = state.staff.development.find((item) => item.employeeId === employee.id && item.status === "in_progress");
        return `
          <div class="record">
            <div class="record-title">${escapeHtml(employee.name)} <span class="badge ${level.tone}">${level.label}</span></div>
            <div class="record-meta">${escapeHtml(employee.roleLabel)} &middot; ${escapeHtml(staffGroupLabel(employee.groupId))} &middot; Salario: ${money(employee.salary)} &middot; Contrato ate ${formatDate(employee.contractEndAt)}</div>
            <div class="record-meta">Desempenho: ${number(employee.performance)} &middot; Moral: ${number(employee.moral)} &middot; Carga: ${number(employee.workload)}% &middot; Local: ${escapeHtml(employee.workplace)}</div>
            <div class="record-meta">Chefe direto: ${escapeHtml(employee.managerName || "Nao definido")} &middot; Evolucao acumulada: +${employee.evolution}</div>
            <div class="progress teal"><span style="width:${getEmployeeEfficiency(employee)}%"></span></div>
            ${compact ? "" : `
              <div class="action-row">
                ${developmentMode ? `
                  ${activeDevelopment ? `<span class="badge warn" data-countdown="${activeDevelopment.endAt}">${remainingTime(activeDevelopment.endAt)}</span>` : `<button class="button small primary" data-action="start-staff-development" data-id="${employee.id}">Enviar para curso</button>`}
                ` : `
                  <button class="button small" data-action="renew-staff" data-id="${employee.id}">Renovar</button>
                  <button class="button small" data-action="promote-staff" data-id="${employee.id}">Promover</button>
                  <button class="button small danger" data-action="fire-staff" data-id="${employee.id}">Demitir</button>
                `}
              </div>
            `}
          </div>
        `;
      }).join("")}
    </div>`;
  }

  function renderStaffHistoryList(history) {
    if (!history.length) return empty("Nenhum registro de funcionarios.");
    return `<div class="timeline">
      ${history.map((item) => `
        <div class="event-row">
          <span class="event-dot"></span>
          <div class="event-content">
            <strong>${escapeHtml(item.professionalName)}</strong>
            <span>${formatDate(item.date)} &middot; ${escapeHtml(item.event)}</span>
            <p>Financeiro: ${item.financialImpact ? money(item.financialImpact) : "sem impacto"} &middot; Esportivo: ${number(item.sportingImpact || 0)} &middot; Institucional: ${number(item.institutionalImpact || 0)}</p>
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function renderProperty() {
    return `
      <section class="metric-grid">
        <div class="metric"><span>Valor patrimonial</span><strong>${money(getPropertyValue())}</strong><em>Bens proprios e construidos.</em></div>
        <div class="metric"><span>Terrenos</span><strong>${state.facilities.lands.length}</strong><em>Areas compradas.</em></div>
        <div class="metric"><span>Instalacoes CT</span><strong>${state.facilities.trainingCenter.facilities.filter((item) => item.status === "active").length}</strong><em>Obras concluidas.</em></div>
        <div class="metric"><span>Capacidade estadio</span><strong>${number(getStadiumCapacity())}</strong><em>Lugares ativos.</em></div>
      </section>
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Mapa de patrimonio</h2><p>Resumo dos ativos e manutencoes separadas.</p></div></div>
          <div class="asset-map">
            <div class="asset-tile"><span>Campo municipal</span><strong>${state.facilities.municipalField?.active ? "Ativo" : "Nao solicitado"}</strong><em>${state.facilities.municipalField?.active ? money(891.72) + " por mes" : "Sem custo mensal"}</em></div>
            <div class="asset-tile"><span>Salas</span><strong>${state.facilities.adminRooms.length}</strong><em>Capacidade total: ${number(getAdminCapacity())}</em></div>
            <div class="asset-tile"><span>Terrenos</span><strong>${number(getTotalLandArea())} m2</strong><em>${money(state.facilities.lands.reduce((sum, land) => sum + land.monthlyMaintenance, 0))} / mes</em></div>
            <div class="asset-tile"><span>CT</span><strong>${state.facilities.trainingCenter.facilities.length}</strong><em>${money(state.facilities.trainingCenter.facilities.reduce((sum, item) => sum + item.monthlyMaintenance, 0))} / mes</em></div>
            <div class="asset-tile"><span>Estadio proprio</span><strong>${number(getStadiumCapacity())}</strong><em>${state.facilities.stadium.modules.filter((module) => module.status === "active").length} modulo(s)</em></div>
          </div>
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Obras</h2><p>Todas as construcoes e aquisicoes com prazo.</p></div></div>
          ${state.constructions.length ? renderConstructionList(state.constructions) : empty("Nenhuma obra registrada.")}
        </div>
      </section>
    `;
  }

  function getAdminCapacity() {
    const external = state.facilities.adminRooms.reduce((sum, room) => sum + (room.status === "active" ? room.capacity : 0), 0);
    const ct = state.facilities.trainingCenter.facilities
      .filter((facility) => facility.status === "active" && facility.capacity)
      .reduce((sum, facility) => sum + facility.capacity, 0);
    return external + ct;
  }

  function getTotalLandArea() {
    return state.facilities.lands.reduce((sum, land) => sum + land.area, 0);
  }

  function getStadiumCapacity() {
    return state.facilities.stadium.modules
      .filter((module) => module.status === "active")
      .reduce((sum, module) => sum + module.seats, 0);
  }

  function renderRooms() {
    return `
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header">
            <div><h2>Comprar ou alugar sala</h2><p>Cada sala suporta 6 funcionarios. Prazo de 24 horas.</p></div>
          </div>
          <form id="admin-room-form" class="form-grid">
            <label class="field">Localizacao
              <select name="optionId">
                ${ADMIN_ROOM_OPTIONS.map((option) => `<option value="${option.id}">${option.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Operacao
              <select name="mode">
                <option value="purchase">Comprar</option>
                <option value="rent">Alugar</option>
              </select>
            </label>
            <div class="field full">
              <div class="total-strip">
                <span>Valor inicial</span>
                <strong id="admin-room-cost">${money(ADMIN_ROOM_OPTIONS[0].purchase)}</strong>
              </div>
              <div class="record-meta" id="admin-room-monthly">Manutencao mensal: ${money(ADMIN_ROOM_OPTIONS[0].purchase * 0.015)}</div>
            </div>
            <div class="field full"><button class="button primary" type="submit">Iniciar aquisicao</button></div>
          </form>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div><h2>Salas ativas</h2><p>Aluguel e manutencao separados.</p></div>
          </div>
          ${renderAdminRooms()}
        </div>
      </section>
    `;
  }

  function renderAdminRooms() {
    const rooms = state.facilities.adminRooms.filter((room) => room.status === "active");
    if (!rooms.length) return empty("Nenhuma sala administrativa ativa.");
    return `<div class="table-list">
      ${rooms.map((room) => `
        <div class="record">
          <div class="record-title">${escapeHtml(room.name)} <span class="badge">${room.mode === "rent" ? "Alugada" : "Propria"}</span></div>
          <div class="record-meta">Capacidade: ${room.capacity} funcionarios &middot; Aluguel: ${money(room.monthlyRent)} &middot; Manutencao: ${money(room.monthlyMaintenance)}</div>
          <div class="record-meta">Proxima cobranca: ${formatDate(room.nextChargeAt)}</div>
        </div>
      `).join("")}
    </div>`;
  }

  function renderLand() {
    return `
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header">
            <div><h2>Comprar terreno</h2><p>Proprietarios ficticios nesta versao.</p></div>
          </div>
          <form id="land-form" class="form-grid">
            <label class="field">Localizacao
              <select name="zoneId">
                ${LAND_ZONES.map((zone) => `<option value="${zone.id}">${zone.label} - ${money(zone.priceM2)}/m2</option>`).join("")}
              </select>
            </label>
            <label class="field">Area (m2)
              <input name="area" type="number" min="1" step="1" value="1000" required />
            </label>
            <div class="field full">
              <div class="total-strip">
                <span>Preco calculado</span>
                <strong id="land-cost">${money(LAND_ZONES[0].priceM2 * 1000)}</strong>
              </div>
            </div>
            <div class="field full"><button class="button primary" type="submit">Comprar terreno</button></div>
          </form>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div><h2>Terrenos comprados</h2><p>Area disponivel considera CT e estadio.</p></div>
          </div>
          ${renderLandList()}
        </div>
      </section>
    `;
  }

  function renderLandList() {
    if (!state.facilities.lands.length) return empty("Nenhum terreno comprado.");
    return `<div class="table-list">
      ${state.facilities.lands.map((land) => `
        <div class="record">
          <div class="record-title">${escapeHtml(land.zoneLabel)} <span class="badge">${number(land.area)} m2</span></div>
          <div class="record-meta">Custo: ${money(land.price)} &middot; Manutencao: ${money(land.monthlyMaintenance)} / mes</div>
          <div class="record-meta">Area livre: ${number(getLandFreeArea(land.id))} m2 &middot; Proxima cobranca: ${formatDate(land.nextChargeAt)}</div>
        </div>
      `).join("")}
    </div>`;
  }

  function renderTraining() {
    return `
      <section class="view-grid">
        <div class="panel two-thirds">
          <div class="panel-header">
            <div><h2>Construir instalacao</h2><p>Validacao de area disponivel no terreno selecionado.</p></div>
          </div>
          <form id="ct-form" class="form-grid three">
            <label class="field">Terreno
              <select name="landId" required>
                ${landOptionsHtml()}
              </select>
            </label>
            <label class="field">Instalacao
              <select name="typeId">
                ${CT_FACILITIES.map((facility) => `<option value="${facility.id}">${facility.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Nivel
              <select name="level">
                ${LEVELS.map((level) => `<option value="${level.id}">${level.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Base de custo
              <select name="adminCostZone">
                ${ADMIN_ROOM_OPTIONS.map((option) => `<option value="${option.id}">${option.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Quantidade de salas
              <input name="roomCount" type="number" min="3" max="20" value="3" />
            </label>
            <div class="field full">
              <div class="total-strip">
                <span id="ct-area-label">Area e custo</span>
                <strong id="ct-cost">${money(0)}</strong>
              </div>
              <div class="record-meta" id="ct-benefit"></div>
            </div>
            <div class="field full"><button class="button primary" type="submit" ${state.facilities.lands.length ? "" : "disabled"}>Iniciar obra do CT</button></div>
          </form>
        </div>
        <div class="panel third">
          <div class="panel-header"><div><h2>Ocupacao</h2><p>Uso atual por terreno.</p></div></div>
          ${state.facilities.lands.length ? `
            <div class="table-list">
              ${state.facilities.lands.map((land) => `
                <div class="record">
                  <div class="record-title">${escapeHtml(land.zoneLabel)}</div>
                  <div class="record-meta">${number(getLandUsage(land.id))} m2 usados de ${number(land.area)} m2</div>
                  <div class="progress teal"><span style="width:${clamp((getLandUsage(land.id) / land.area) * 100, 0, 100)}%"></span></div>
                </div>
              `).join("")}
            </div>
          ` : empty("Compre um terreno para iniciar o CT.")}
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Instalacoes do CT</h2><p>Estrutura define teto; profissionais e decisoes virao em etapas futuras.</p></div></div>
          ${renderCtFacilities()}
        </div>
      </section>
    `;
  }

  function landOptionsHtml() {
    if (!state.facilities.lands.length) return `<option value="">Nenhum terreno disponivel</option>`;
    return state.facilities.lands.map((land) => `<option value="${land.id}">${land.zoneLabel} - livre ${number(getLandFreeArea(land.id))} m2</option>`).join("");
  }

  function renderCtFacilities() {
    const facilities = state.facilities.trainingCenter.facilities.filter((facility) => facility.status === "active");
    if (!facilities.length) return empty("Nenhuma instalacao do CT concluida.");
    return `<div class="table-list">
      ${facilities.map((facility) => `
        <div class="record row">
          <div>
            <div class="record-title">${escapeHtml(facility.displayName || facility.label)} <span class="badge">${getLevelLabel(facility.level)}</span></div>
            <div class="record-meta">Area: ${number(facility.area)} m2 &middot; Custo: ${money(facility.cost)} &middot; Manutencao: ${money(facility.monthlyMaintenance)}</div>
            <div class="record-meta">${escapeHtml(facility.benefit)}</div>
          </div>
          <span class="badge">Prox. ${formatDate(facility.nextChargeAt)}</span>
        </div>
      `).join("")}
    </div>`;
  }

  function renderStadium() {
    return `
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header">
            <div><h2>Estadio municipal</h2><p>Aluguel por partida com 20% da renda bruta.</p></div>
          </div>
          <form id="municipal-stadium-form" class="form-grid">
            <label class="field">Publico
              <input name="crowd" type="number" min="0" step="1" value="800" required />
            </label>
            <label class="field">Ingresso medio
              <input name="ticketPrice" type="number" min="0" step="0.01" value="20" required />
            </label>
            <div class="field full">
              <div class="total-strip">
                <span>Resultado liquido</span>
                <strong id="municipal-stadium-net">${money(800 * 20 - 1016.38 - (800 * 20 * 0.2))}</strong>
              </div>
              <div class="record-meta" id="municipal-stadium-detail"></div>
            </div>
            <div class="field full"><button class="button primary" type="submit">Simular partida</button></div>
          </form>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div><h2>Campo municipal</h2><p>Disponivel para todos os clubes, sem conflito de agenda.</p></div>
          </div>
          ${state.facilities.municipalField?.active ? `
            <div class="notice">Campo municipal ativo. Custo mensal: <strong>${money(891.72)}</strong>. Proxima cobranca: ${formatDate(state.facilities.municipalField.nextChargeAt)}.</div>
          ` : `<button class="button primary" data-action="request-municipal-field">Solicitar campo municipal</button>`}
        </div>
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Estadio proprio</h2><p>Construtora ficticia: Construtora Estadio Novo Brasil S.A.</p></div>
            <span class="badge info">${number(getStadiumCapacity())} lugares</span>
          </div>
          <form id="stadium-form" class="form-grid three">
            <label class="field">Terreno
              <select name="landId" required>${landOptionsHtml()}</select>
            </label>
            <label class="field">Modulo
              <select name="seats">
                ${STADIUM_MODULES.map((module) => `<option value="${module.seats}">${number(module.seats)} lugares - ${module.weeks} semana(s)</option>`).join("")}
              </select>
            </label>
            <label class="field">Nivel
              <select name="level">
                ${LEVELS.map((level) => `<option value="${level.id}">${level.label}</option>`).join("")}
              </select>
            </label>
            <label class="field">Operacao
              <select name="mode">
                <option value="expand">Ampliar / construir modulo</option>
                <option value="reform">Reformar modulo existente</option>
              </select>
            </label>
            <label class="field">Modulo para reforma
              <select name="reformOfId">
                <option value="">Selecionar se for reforma</option>
                ${state.facilities.stadium.modules.filter((module) => module.status === "active").map((module) => `<option value="${module.id}">${number(module.seats)} lugares - ${getLevelLabel(module.level)}</option>`).join("")}
              </select>
            </label>
            <div class="field full">
              <div class="total-strip">
                <span id="stadium-area-label">Custo do modulo</span>
                <strong id="stadium-cost">${money(0)}</strong>
              </div>
              <div class="record-meta" id="stadium-detail"></div>
            </div>
            <div class="field full"><button class="button primary" type="submit" ${state.facilities.lands.length ? "" : "disabled"}>Iniciar obra do estadio</button></div>
          </form>
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Modulos existentes</h2><p>Um estadio pode misturar categorias de modulo.</p></div></div>
          ${renderStadiumModules()}
        </div>
      </section>
    `;
  }

  function renderStadiumModules() {
    const modules = state.facilities.stadium.modules.filter((module) => module.status === "active");
    if (!modules.length) return empty("Nenhum modulo de estadio concluido.");
    return `<div class="table-list">
      ${modules.map((module) => `
        <div class="record row">
          <div>
            <div class="record-title">${number(module.seats)} lugares <span class="badge">${getLevelLabel(module.level)}</span></div>
            <div class="record-meta">Custo: ${money(module.cost)} &middot; Manutencao: ${money(module.monthlyMaintenance)} &middot; Terreno: ${escapeHtml(getLandLabel(module.landId))}</div>
          </div>
          <span class="badge">Prox. ${formatDate(module.nextChargeAt)}</span>
        </div>
      `).join("")}
    </div>`;
  }

  function getLandLabel(landId) {
    return state.facilities.lands.find((land) => land.id === landId)?.zoneLabel || "Terreno";
  }

  function renderYouth() {
    const quality = calculateYouthQuality();
    return `
      ${renderSquadTabs()}
      <section class="metric-grid">
        <div class="metric"><span>Nota total</span><strong>${number(quality.total, 1)}/100</strong><em>Estrutura, treinadores, olheiros e metodologia.</em></div>
        <div class="metric"><span>Estrutura</span><strong>${number(quality.structure, 1)}</strong><em>Peso maximo: 42.</em></div>
        <div class="metric"><span>Jovens gerados</span><strong>${state.players.youth.length}</strong><em>Ficticios para teste.</em></div>
        <div class="metric"><span>Elenco principal</span><strong>${state.players.squad.length}</strong><em>Atletas contratados ou promovidos.</em></div>
      </section>
      <section class="view-grid">
        <div class="panel">
          <div class="panel-header"><div><h2>Componentes</h2><p>Simule os valores dos profissionais e metodologia.</p></div></div>
          <form id="youth-settings-form" class="stack">
            ${rangeRow("coaches", "Treinadores", state.youthAcademy.coaches)}
            ${rangeRow("scouts", "Olheiros", state.youthAcademy.scouts)}
            ${rangeRow("methodology", "Metodologia", state.youthAcademy.methodology)}
          </form>
          <div class="table-list" style="margin-top:14px">
            <div class="record row"><span>Estrutura da base</span><strong>${number(quality.structure, 1)} / 42</strong></div>
            <div class="record row"><span>Treinadores da base</span><strong>${number(quality.coaches, 1)} / 21</strong></div>
            <div class="record row"><span>Olheiros da base</span><strong>${number(quality.scouts, 1)} / 21</strong></div>
            <div class="record row"><span>Metodologia e treinamento</span><strong>${number(quality.methodology, 1)} / 16</strong></div>
          </div>
          <div class="button-row">
            <button class="button primary" data-action="generate-youth">Gerar jovens ficticios</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><div><h2>Jovens da base</h2><p>Qualidade atual, potencial e velocidade estimada.</p></div></div>
          ${renderPlayerList(state.players.youth, "youth")}
        </div>
      </section>
    `;
  }

  function rangeRow(name, label, value) {
    return `
      <label class="range-row">${label}
        <input type="range" name="${name}" min="0" max="100" value="${value}" />
        <strong data-range-value="${name}">${value}</strong>
      </label>
    `;
  }

  function renderSquad() {
    return `
      ${renderSquadTabs()}
      <section class="metric-grid">
        <div class="metric"><span>Atletas no plantel</span><strong>${state.players.squad.length}</strong><em>Contratados ou promovidos.</em></div>
        <div class="metric"><span>Atletas encontrados</span><strong>${state.players.tryoutFindings.length}</strong><em>Disponiveis no mercado de peneiras.</em></div>
        <div class="metric"><span>Jovens da base</span><strong>${state.players.youth.length}</strong><em>${hasYouthAcademySignal() ? "Base disponivel." : "Aba aparece apos estrutura de base."}</em></div>
        <div class="metric"><span>Estrutura de treino</span><strong>${hasCtSignal() ? "CT" : state.facilities.municipalField?.active ? "Municipal" : "Improvisada"}</strong><em>Teto de aproveitamento esportivo.</em></div>
      </section>
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Elenco principal</h2><p>Jogadores contratados e jovens promovidos.</p></div></div>
          ${renderPlayerList(state.players.squad, "squad")}
        </div>
        <div class="panel wide">
          <div class="panel-header"><div><h2>Acessos esportivos</h2><p>Atividades relacionadas ao plantel foram redistribuidas em abas internas.</p></div></div>
          <div class="split">
            ${renderContextCard({ title: "Jogos-treino", text: "Treino reduzido e jogo-treino completo ficam na aba Jogos-Treino.", actionLabel: "Abrir", view: "squadInternal" })}
            ${renderContextCard({ title: "Peneiras", text: "Busca de atletas externos agora fica em Mercado > Peneiras.", actionLabel: "Abrir mercado", view: "marketTryouts" })}
          </div>
        </div>
      </section>
    `;
  }

  function renderPlayerList(players, source) {
    if (!players.length) return empty("Nenhum atleta listado.");
    return `<div class="table-list">
      ${players.map((player) => `
        <div class="record">
          <div class="record-title">${escapeHtml(player.name)} <span class="badge">${player.position}</span></div>
          <div class="record-meta">Idade: ${player.age} &middot; Qualidade atual: ${number(player.current, 0)} &middot; Potencial: ${number(player.potential, 0)} &middot; Desenvolvimento: ${escapeHtml(player.development)}</div>
          ${source === "tryout" ? `<button class="button small primary" data-action="hire-player" data-id="${player.id}">Contratar</button>` : ""}
          ${source === "youth" ? `<button class="button small primary" data-action="promote-youth" data-id="${player.id}">Promover jovem</button>` : ""}
        </div>
      `).join("")}
    </div>`;
  }

  function renderTryoutPanel() {
    return `
      <div class="panel">
        <div class="panel-header"><div><h2>Criar peneira</h2><p>Duracao provisoria: ${PROVISIONAL_TRYOUT_DURATION_MINUTES} minuto(s).</p></div></div>
        <form id="tryout-form" class="form-grid">
          <label class="field">Custo opcional
            <input name="cost" type="number" min="0" step="0.01" value="0" />
          </label>
          <label class="field">Perfil
            <select name="profile">
              <option value="local">Atletas locais</option>
              <option value="regional">Observacao regional</option>
              <option value="open">Peneira aberta</option>
            </select>
          </label>
          <div class="field full"><button class="button primary" type="submit">Realizar peneira</button></div>
        </form>
      </div>
    `;
  }

  function renderInternalTrainingPanel() {
    return `
      <div class="panel">
        <div class="panel-header"><div><h2>Jogos-treino internos</h2><p>Sem adversarios artificiais, renda ou metas oficiais.</p></div></div>
        <div class="button-row">
          <button class="button primary" data-action="internal-training-small" ${state.players.squad.length < 10 ? "disabled" : ""}>Treino reduzido</button>
          <button class="button primary" data-action="internal-training-full" ${state.players.squad.length < 22 ? "disabled" : ""}>Jogo-treino completo</button>
        </div>
        <p class="muted">Elenco atual: ${state.players.squad.length} atleta(s). Minimos: 10 para treino reduzido, 22 para jogo completo.</p>
      </div>
    `;
  }

  function renderEvents() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header"><div><h2>Historico geral</h2><p>Cada evento registra data, tipo, impacto financeiro e reputacao.</p></div></div>
          ${renderEventsList(state.events, true)}
        </div>
      </section>
    `;
  }

  function renderSettings() {
    return `
      <section class="view-grid">
        <div class="panel wide">
          <div class="panel-header">
            <div><h2>Dados locais</h2><p>O prototipo usa somente localStorage neste navegador.</p></div>
            <span class="badge info">v${state.version}</span>
          </div>
          <div class="split">
            <div class="record">
              <div class="record-title">Ultima atualizacao salva</div>
              <div class="record-meta">${state.lastUpdateAt ? formatDate(state.lastUpdateAt) : "Ainda nao salva"}</div>
            </div>
            <div class="record">
              <div class="record-title">Eventos armazenados</div>
              <div class="record-meta">${state.events.length} registros no historico.</div>
            </div>
          </div>
          <div class="button-row">
            <button class="button danger" data-action="reset-prototype">Reiniciar prototipo</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderConstructionList(list) {
    return `<div class="table-list">
      ${list.map((construction) => `
        <div class="record row">
          <div>
            <div class="record-title">${escapeHtml(construction.title)} ${construction.status === "in_progress" ? '<span class="badge warn">Em obra</span>' : '<span class="badge good">Concluida</span>'}</div>
            <div class="record-meta">Inicio: ${formatDate(construction.startAt)} &middot; Conclusao: ${formatDate(construction.endAt)} &middot; Custo: ${money(construction.cost)}</div>
          </div>
          ${construction.status === "in_progress"
            ? `<span class="badge" data-countdown="${construction.endAt}">${remainingTime(construction.endAt)}</span>`
            : '<span class="badge">Concluida</span>'}
        </div>
      `).join("")}
    </div>`;
  }

  function renderUpcomingEvents() {
    const upcoming = getUpcomingEventItems();
    if (!upcoming.length) return empty("Nenhum evento futuro registrado.");
    return `<div class="table-list">
      ${upcoming.slice(0, 8).map((event) => `
        <div class="record row">
          <div>
            <div class="record-title">${escapeHtml(event.title)}</div>
            <div class="record-meta">${escapeHtml(event.type)} &middot; ${formatDate(event.date)}</div>
          </div>
          <span class="badge" data-countdown="${event.date}">${remainingTime(event.date)}</span>
        </div>
      `).join("")}
    </div>`;
  }

  function renderEventsList(events, showImpact = false) {
    if (!events.length) return empty("Nenhum evento registrado.");
    return `<div class="timeline">
      ${events.map((event) => `
        <div class="event-row">
          <span class="event-dot"></span>
          <div class="event-content">
            <strong>${escapeHtml(event.title)}</strong>
            <span>${formatDate(event.date)} &middot; ${escapeHtml(event.type)}</span>
            <p>${escapeHtml(event.description)}</p>
            ${showImpact ? `<span class="${event.financialImpact > 0 ? "money-plus" : event.financialImpact < 0 ? "money-minus" : ""}">${event.financialImpact ? money(event.financialImpact) : "Sem impacto financeiro"}</span>` : ""}
          </div>
        </div>
      `).join("")}
    </div>`;
  }

  function empty(text) {
    return `<div class="empty">${text}</div>`;
  }

  function handleSubmit(event) {
    const form = event.target.closest("form");
    if (!form) return;
    if (form.id === "create-club-form") {
      event.preventDefault();
      createClub(form);
    }
    if (form.id === "donations-form") {
      event.preventDefault();
      confirmDonations(form);
    }
    if (form.id === "promise-form") {
      event.preventDefault();
      createPromise(form);
    }
    if (form.id === "sponsor-quota-form") {
      event.preventDefault();
      createSponsorQuota(form);
    }
    if (form.id === "admin-room-form") {
      event.preventDefault();
      acquireAdminRoom(form);
    }
    if (form.id === "land-form") {
      event.preventDefault();
      buyLand(form);
    }
    if (form.id === "ct-form") {
      event.preventDefault();
      buildCtFacility(form);
    }
    if (form.id === "municipal-stadium-form") {
      event.preventDefault();
      simulateMunicipalStadiumMatch(form);
    }
    if (form.id === "stadium-form") {
      event.preventDefault();
      buildStadiumModule(form);
    }
    if (form.id === "tryout-form") {
      event.preventDefault();
      startTryout(form);
    }
    if (form.id === "staff-filter-form") {
      event.preventDefault();
      applyStaffFilters(form);
    }
    if (form.id === "staff-proposal-form") {
      event.preventDefault();
      sendStaffProposal(form);
    }
    if (form.id === "press-communication-form") {
      event.preventDefault();
      createPressCommunication(form);
    }
    if (form.id === "club-search-form") {
      event.preventDefault();
      applyClubSearch(form);
    }
    const handledForms = new Set([
      "donations-form",
      "promise-form",
      "sponsor-quota-form",
      "admin-room-form",
      "land-form",
      "ct-form",
      "municipal-stadium-form",
      "stadium-form",
      "tryout-form",
      "staff-filter-form",
      "staff-proposal-form",
      "press-communication-form",
      "club-search-form",
    ]);
    if (handledForms.has(form.id)) {
      saveState();
      render();
    }
  }

  function handleClick(event) {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      currentView = nav.dataset.view;
      const installationByView = INSTALLATION_NAV_ITEMS.find((item) => item.view === currentView);
      if (installationByView) currentInstallationTab = installationByView.id;
      if (currentView === "staff") {
        currentStaffTab = state.staff.activeTab || currentStaffTab || "overview";
        setPrototypeRoute(nav.dataset.route || STAFF_TABS.find((tab) => tab.id === currentStaffTab)?.route || "/escritorio/funcionarios");
      } else {
        setPrototypeRoute(nav.dataset.route || VIEW_ROUTES[currentView]);
      }
      saveState();
      render();
      return;
    }

    const staffTab = event.target.closest("[data-staff-tab]");
    if (staffTab) {
      currentView = "staff";
      currentStaffTab = staffTab.dataset.staffTab;
      state.staff.activeTab = currentStaffTab;
      setPrototypeRoute(staffTab.dataset.route);
      saveState();
      render();
      return;
    }

    const installationTab = event.target.closest("[data-installation-tab]");
    if (installationTab) {
      currentView = "installations";
      currentInstallationTab = installationTab.dataset.installationTab;
      setPrototypeRoute(installationTab.dataset.route);
      saveState();
      render();
      return;
    }

    const profileLink = event.target.closest("[data-profile-slug]");
    if (profileLink) {
      const club = getPublicClubBySlug(profileLink.dataset.profileSlug);
      if (club) {
        currentView = "pressPublicProfile";
        state.press.profileSlug = club.slug;
        setPrototypeRoute(`${VIEW_ROUTES.pressPublicProfile}/${club.slug}`);
        saveState();
        render();
      }
      return;
    }

    const publicProfileTab = event.target.closest("[data-public-profile-tab]");
    if (publicProfileTab) {
      state.press.profileTab = publicProfileTab.dataset.publicProfileTab;
      saveState();
      render();
      return;
    }

    const horizonFilter = event.target.closest("[data-horizon-filter]");
    if (horizonFilter) {
      state.press.horizonFilter = horizonFilter.dataset.horizonFilter;
      saveState();
      render();
      return;
    }

    const transferFilter = event.target.closest("[data-transfer-filter]");
    if (transferFilter) {
      state.press.transferFilter = transferFilter.dataset.transferFilter;
      saveState();
      render();
      return;
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    const id = action.dataset.id;
    const actions = {
      "dismiss-offline-report": () => {
        if (state.offlineReport) state.offlineReport.seen = true;
      },
      "request-grant": requestGrant,
      "accept-grant": acceptGrant,
      "fulfill-grant": fulfillGrant,
      "default-grant": defaultGrant,
      "parcel-grant": parcelGrant,
      "pay-grant-parcel": () => payGrantParcel(id),
      "request-municipal-field": requestMunicipalField,
      "generate-sponsor-proposals": () => generateSponsorProposals(id),
      "accept-proposal": () => acceptProposal(id),
      "reject-proposal": () => rejectProposal(id),
      "generate-youth": generateYouth,
      "hire-player": () => hirePlayer(id),
      "promote-youth": () => promoteYouth(id),
      "internal-training-small": () => simulateInternalTraining("small"),
      "internal-training-full": () => simulateInternalTraining("full"),
      "reset-staff-filters": () => {
        state.staff.filters = {};
      },
      "refresh-staff-market": refreshStaffMarket,
      "observe-professional": () => setProfessionalStatus(id, "observed", "Profissional observado"),
      "shortlist-professional": () => setProfessionalStatus(id, "shortlisted", "Profissional salvo na lista de interesse"),
      "remove-staff-interest": () => setProfessionalStatus(id, "available", "Profissional removido da lista"),
      "reject-professional": () => setProfessionalStatus(id, "rejected", "Profissional rejeitado pelo clube"),
      "open-staff-proposal": () => openStaffProposal(id),
      "resolve-staff-proposal": () => resolveStaffProposal(id),
      "accept-staff-counter": () => acceptStaffCounter(id),
      "cancel-staff-proposal": () => cancelStaffProposal(id),
      "renew-staff": () => renewStaff(id),
      "promote-staff": () => promoteStaff(id),
      "fire-staff": () => fireStaff(id),
      "start-staff-development": () => startStaffDevelopment(id),
      "follow-public-club": () => toggleFollowPublicClub(id),
      "reset-prototype": resetPrototype,
    };
    if (actions[action.dataset.action]) {
      actions[action.dataset.action]();
      saveState();
      render();
    }
  }

  function handleInput(event) {
    if (event.target.closest("#create-club-form")) updateSetupPreview();
    if (event.target.closest("#youth-settings-form")) {
      const form = event.target.closest("#youth-settings-form");
      state.youthAcademy.coaches = toNumber(form.elements.coaches.value);
      state.youthAcademy.scouts = toNumber(form.elements.scouts.value);
      state.youthAcademy.methodology = toNumber(form.elements.methodology.value);
      saveState();
      render();
      return;
    }
    updateEstimators();
  }

  function updateSetupPreview() {
    const form = document.querySelector("#create-club-form");
    if (!form) return;
    const club = {
      acronym: form.elements.acronym.value.toUpperCase().slice(0, 4) || "FC",
      shieldShape: form.elements.shieldShape.value,
      uniformPattern: form.elements.uniformPattern.value,
      colors: {
        primary: form.elements.primaryColor.value,
        secondary: form.elements.secondaryColor.value,
        accent: form.elements.accentColor.value,
      },
    };
    const crest = document.querySelector("#setup-crest");
    const jersey = document.querySelector("#setup-jersey");
    if (crest) crest.innerHTML = crestMarkup(club);
    if (jersey) jersey.innerHTML = jerseyMarkup(club);
  }

  function updateLivePieces() {
    const clock = document.querySelector("#server-clock");
    if (clock) clock.textContent = formatDate(Clock.iso());
    document.querySelectorAll("[data-countdown]").forEach((node) => {
      const date = node.getAttribute("data-countdown");
      if (date) node.textContent = remainingTime(date);
    });
  }

  function updateEstimators() {
    updateDonationTotal();
    updateAdminRoomEstimator();
    updateLandEstimator();
    updateCtEstimator();
    updateMunicipalStadiumEstimator();
    updateStadiumEstimator();
    updateSponsorEstimator();
    updateStaffProposalEstimator();
  }

  function updateDonationTotal() {
    const form = document.querySelector("#donations-form");
    const total = document.querySelector("#donation-total");
    if (!form || !total) return;
    const selected = [...form.querySelectorAll("input[name='donations']:checked")].map((input) => input.value);
    const amount = selected.reduce((sum, id) => sum + (DONATIONS.find((item) => item.id === id)?.amount || 0), 0);
    total.textContent = money(amount);
  }

  function updateAdminRoomEstimator() {
    const form = document.querySelector("#admin-room-form");
    if (!form) return;
    const option = ADMIN_ROOM_OPTIONS.find((item) => item.id === form.elements.optionId.value) || ADMIN_ROOM_OPTIONS[0];
    const mode = form.elements.mode.value;
    const cost = mode === "purchase" ? option.purchase : option.rent;
    const costNode = document.querySelector("#admin-room-cost");
    const monthlyNode = document.querySelector("#admin-room-monthly");
    if (costNode) costNode.textContent = money(cost);
    if (monthlyNode) {
      monthlyNode.textContent = mode === "purchase"
        ? `Manutencao mensal: ${money(option.purchase * 0.015)}`
        : `Aluguel: ${money(option.rent)} | Manutencao: ${money(option.purchase * 0.015)} | Total: ${money(option.rent + option.purchase * 0.015)}`;
    }
  }

  function updateLandEstimator() {
    const form = document.querySelector("#land-form");
    if (!form) return;
    const zone = LAND_ZONES.find((item) => item.id === form.elements.zoneId.value) || LAND_ZONES[0];
    const area = Math.max(1, toNumber(form.elements.area.value));
    const node = document.querySelector("#land-cost");
    if (node) node.textContent = money(zone.priceM2 * area);
  }

  function updateCtEstimator() {
    const form = document.querySelector("#ct-form");
    if (!form) return;
    const result = calculateCtBuild(form);
    const costNode = document.querySelector("#ct-cost");
    const areaNode = document.querySelector("#ct-area-label");
    const benefitNode = document.querySelector("#ct-benefit");
    if (costNode) costNode.textContent = money(result.cost);
    if (areaNode) areaNode.textContent = `Area: ${number(result.area)} m2 | Prazo: ${result.buildDays} dia(s)`;
    if (benefitNode) benefitNode.textContent = `${result.displayName}. ${result.benefit}`;
  }

  function updateMunicipalStadiumEstimator() {
    const form = document.querySelector("#municipal-stadium-form");
    if (!form) return;
    const crowd = Math.max(0, toNumber(form.elements.crowd.value));
    const ticket = Math.max(0, toNumber(form.elements.ticketPrice.value));
    const gross = crowd * ticket;
    const variableCost = gross * 0.2;
    const totalCost = 1016.38 + variableCost;
    const net = gross - totalCost;
    const netNode = document.querySelector("#municipal-stadium-net");
    const detailNode = document.querySelector("#municipal-stadium-detail");
    if (netNode) netNode.textContent = money(net);
    if (detailNode) detailNode.textContent = `Renda bruta: ${money(gross)} | 20%: ${money(variableCost)} | Custo total: ${money(totalCost)}`;
  }

  function updateStadiumEstimator() {
    const form = document.querySelector("#stadium-form");
    if (!form) return;
    const result = calculateStadiumBuild(form);
    const costNode = document.querySelector("#stadium-cost");
    const areaNode = document.querySelector("#stadium-area-label");
    const detailNode = document.querySelector("#stadium-detail");
    if (costNode) costNode.textContent = money(result.cost);
    if (areaNode) areaNode.textContent = `Area minima no terreno: ${number(result.requiredArea)} m2`;
    if (detailNode) detailNode.textContent = `${number(result.seats)} lugares | ${result.weeks} semana(s) | ${money(result.seatCost)} por assento`;
  }

  function updateSponsorEstimator() {
    const form = document.querySelector("#sponsor-quota-form");
    if (!form) return;
    const quota = quotaFromForm(form, false);
    const estimate = estimateQuotaValue(quota);
    const node = document.querySelector("#sponsor-estimate");
    if (node) node.textContent = money(estimate);
  }

  function updateStaffProposalEstimator() {
    const form = document.querySelector("#staff-proposal-form");
    const node = document.querySelector("#staff-offer-preview");
    if (!form || !node) return;
    const candidate = state.staff.market.find((item) => item.id === form.elements.professionalId.value);
    if (!candidate) {
      node.textContent = "Sem candidato";
      return;
    }
    const offer = {
      roleId: form.elements.roleId.value,
      salary: toNumber(form.elements.salary.value),
      durationMonths: Math.max(1, Math.floor(toNumber(form.elements.durationMonths.value) || 1)),
      bonus: Math.max(0, toNumber(form.elements.bonus.value)),
      terminationPenalty: Math.max(0, toNumber(form.elements.terminationPenalty.value)),
      goals: form.elements.goals.value || "",
      structure: form.elements.structure.value || "office",
      startAt: form.elements.startAt.value ? new Date(form.elements.startAt.value).toISOString() : Clock.iso(),
    };
    const result = evaluateStaffProposal(candidate, offer);
    node.textContent = result.status === "accepted"
      ? `Alta chance de aceite (${number(result.score * 100, 0)}%)`
      : result.status === "counteroffer"
        ? `Contraproposta provavel: ${money(result.counterSalary)}`
        : result.status === "waiting"
          ? "Pode solicitar mais tempo"
          : result.reason;
  }

  function confirmDonations(form) {
    if (state.club.legalModel !== "association") return;
    if (state.donations.confirmed) return;
    const acceptedIds = [...form.querySelectorAll("input[name='donations']:checked")].map((input) => input.value);
    if (!acceptedIds.length) {
      toast("Selecione pelo menos uma doacao.");
      return;
    }
    const total = acceptedIds.reduce((sum, id) => sum + (DONATIONS.find((item) => item.id === id)?.amount || 0), 0);
    state.donations = { confirmed: true, acceptedIds };
    addCash(total, "Doacoes iniciais recebidas", `${acceptedIds.length} entidade(s) apoiaram a fundacao.`, "donation");
    toast("Doacoes registradas no caixa.");
  }

  function requestGrant() {
    if (state.club.legalModel !== "association") return;
    state.municipalGrant.status = "requested";
    state.municipalGrant.requestedAt = Clock.iso();
    addEvent({
      type: "municipal-grant",
      title: "Verba municipal solicitada",
      description: "Solicitacao registrada para avaliacao simulada.",
    });
  }

  function acceptGrant() {
    const grant = state.municipalGrant;
    grant.status = "accepted";
    grant.acceptedAt = Clock.iso();
    grant.deadlineAt = addMonths(Clock.iso(), 2);
    addCash(28764.3, "Verba municipal recebida", "Compromisso simulado de uso de atletas naturais da cidade iniciado.", "municipal-grant");
  }

  function fulfillGrant() {
    state.municipalGrant.status = "fulfilled";
    addEvent({
      type: "municipal-grant",
      title: "Compromisso municipal cumprido",
      description: "Cumprimento registrado por simulacao do prototipo.",
    });
    toast("Compromisso marcado como cumprido.");
  }

  function defaultGrant() {
    const grant = state.municipalGrant;
    grant.status = "debt_active";
    grant.debt = 31640.73;
    grant.debtStartedAt = Clock.iso();
    grant.lastInterestAt = Clock.iso();
    applyReputationChange("institutional", PROVISIONAL_REPUTATION_IMPACTS.grantDefaultInstitutional, "Descumprimento simulado da verba municipal.");
    applyReputationChange("financial", PROVISIONAL_REPUTATION_IMPACTS.grantDefaultFinancial, "Divida municipal assumida.");
    addEvent({
      type: "debt",
      title: "Divida municipal criada",
      description: "Devolucao integral, multa de 10% e juros diarios ficaram ativos.",
      reputationImpact: {
        institutional: PROVISIONAL_REPUTATION_IMPACTS.grantDefaultInstitutional,
        financial: PROVISIONAL_REPUTATION_IMPACTS.grantDefaultFinancial,
      },
    });
    toast("Divida municipal criada.");
  }

  function parcelGrant() {
    const grant = state.municipalGrant;
    if (grant.debt <= 0) return;
    const amount = grant.debt / PROVISIONAL_GRANT_INSTALLMENTS;
    grant.status = "installment";
    grant.installmentPlan = {
      createdAt: Clock.iso(),
      installments: Array.from({ length: PROVISIONAL_GRANT_INSTALLMENTS }, (_, index) => ({
        id: uid("parcel"),
        amount,
        dueAt: addMonths(Clock.iso(), index + 1),
        paid: false,
      })),
    };
    addEvent({
      type: "debt",
      title: "Parcelamento municipal simulado",
      description: `${PROVISIONAL_GRANT_INSTALLMENTS} parcelas provisoriamente criadas.`,
    });
  }

  function payGrantParcel(id) {
    const grant = state.municipalGrant;
    const installment = grant.installmentPlan?.installments.find((item) => item.id === id);
    if (!installment || installment.paid) return;
    if (!spendCash(installment.amount, "Parcela municipal paga", "Pagamento de parcela da divida municipal.", "debt")) return;
    installment.paid = true;
    grant.debt = Math.max(0, grant.debt - installment.amount);
    if (grant.installmentPlan.installments.every((item) => item.paid)) {
      grant.status = "fulfilled";
      grant.financialBlocked = false;
      addEvent({
        type: "debt",
        title: "Divida municipal quitada",
        description: "Todas as parcelas simuladas foram pagas.",
      });
    }
  }

  function requestMunicipalField() {
    if (state.facilities.municipalField?.active) return;
    state.facilities.municipalField = {
      active: true,
      activatedAt: Clock.iso(),
      nextChargeAt: addMonths(Clock.iso(), 1),
      monthlyCost: 891.72,
    };
    addEvent({
      type: "municipal-field",
      title: "Campo municipal solicitado",
      description: "Uso ativado imediatamente com despesa mensal recorrente.",
    });
    toast("Campo municipal ativo.");
  }

  function createPromise(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    state.promises.unshift({
      id: uid("promise"),
      channel: data.channel,
      text: data.text.trim(),
      status: "Ativa",
      date: Clock.iso(),
    });
    addEvent({
      type: "promise",
      title: "Promessa publica registrada",
      description: `${data.channel}: ${data.text.trim()}`,
    });
    form.reset();
  }

  function createPressCommunication(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const status = ["draft", "scheduled", "published", "withdrawn"].includes(data.status) ? data.status : "published";
    const publishAt = data.publishAt ? new Date(data.publishAt).toISOString() : Clock.iso();
    const impact = estimateCommunicationImpact(data.category, data.text);
    const note = {
      id: uid("press-note"),
      title: data.title.trim(),
      text: data.text.trim(),
      category: data.category,
      publishAt,
      clubId: "my-club",
      author: data.author.trim() || "Diretoria",
      reach: estimateCommunicationReach(data.category, data.text, status),
      locality: data.locality || "city",
      hashtags: [state.club.hashtag || makeClubHashtag(state.club.shortName)],
      status,
      impact,
      relevance: estimateCommunicationRelevance(data.category, data.text),
      repercussion: communicationRepercussion(impact, data.category),
    };
    state.press.communications.unshift(note);
    syncPressCommunication(note);

    if (status === "published") {
      if (impact.institutional) applyReputationChange("institutional", impact.institutional, `Comunicado publicado: ${note.category}`);
      if (impact.financial) applyReputationChange("financial", impact.financial, `Comunicado publicado: ${note.category}`);
      if (impact.sporting) applyReputationChange("sporting", impact.sporting, `Comunicado publicado: ${note.category}`);
      if (note.category === "Promessa publica") {
        state.promises.unshift({
          id: uid("promise"),
          channel: "Comunicado oficial",
          text: note.text,
          status: "Ativa",
          date: note.publishAt,
        });
      }
      addEvent({
        type: "press-communication",
        title: `Comunicado publicado: ${note.title}`,
        description: note.text,
        reputationImpact: impact,
        date: note.publishAt,
      });
    } else {
      addEvent({
        type: "press-communication",
        title: status === "scheduled"
          ? `Comunicado agendado: ${note.title}`
          : status === "withdrawn"
            ? `Comunicado retirado: ${note.title}`
            : `Rascunho criado: ${note.title}`,
        description: "Nota salva na area de Comunicados Oficiais.",
      });
    }
    form.reset();
    toast(status === "published" ? "Comunicado publicado." : "Comunicado salvo.");
  }

  function applyClubSearch(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    state.press.clubSearch = String(data.query || "").trim();
  }

  function toggleFollowPublicClub(clubId) {
    const club = getAllPublicClubs().find((item) => item.id === clubId);
    if (!club) return;
    const followed = new Set(state.press.followedClubIds || []);
    if (followed.has(clubId)) {
      followed.delete(clubId);
      toast(`Voce deixou de acompanhar ${club.shortName}.`);
    } else {
      followed.add(clubId);
      toast(`Agora acompanhando ${club.shortName}.`);
    }
    state.press.followedClubIds = [...followed];
  }

  function syncPressCommunication(note) {
    if (globalThis.__GUEST_MODE__ || !globalThis.fetch) return;
    globalThis.fetch("/api/press-releases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(note),
    }).catch(() => {});
  }

  function estimateCommunicationImpact(category, text) {
    const normalized = normalizeText(text);
    const impact = { institutional: 0, financial: 0, sporting: 0 };
    if (category === "Promessa publica") impact.institutional += 0.02;
    if (category === "Pedido de desculpas") impact.institutional += 0.03;
    if (category === "Anuncio de patrocinio") impact.financial += 0.02;
    if (category === "Comunicado esportivo" || category === "Apresentacao de jogador") impact.sporting += 0.02;
    if (category === "Comunicado financeiro" && (normalized.includes("divida") || normalized.includes("crise"))) {
      impact.financial -= 0.02;
      impact.institutional += 0.02;
    }
    if (normalized.includes("mentira") || normalized.includes("negamos qualquer crise")) {
      impact.institutional -= 0.04;
      impact.financial -= 0.02;
    }
    if (normalized.includes("transparencia") || normalized.includes("transparente")) impact.institutional += 0.02;
    return impact;
  }

  function estimateCommunicationReach(category, text, status) {
    if (status !== "published") return 0;
    const base = 900 + Math.round(getReputationAverage() * 550);
    const categoryBoost = ["Anuncio de patrocinio", "Inauguracao", "Comunicado financeiro"].includes(category) ? 900 : 0;
    const lengthBoost = Math.min(700, String(text || "").length * 2);
    return Math.round(base + categoryBoost + lengthBoost);
  }

  function estimateCommunicationRelevance(category, text) {
    const normalized = normalizeText(text);
    let score = 35;
    if (["Anuncio de patrocinio", "Inauguracao", "Comunicado financeiro"].includes(category)) score += 24;
    if (category === "Promessa publica") score += 12;
    if (normalized.includes("divida") || normalized.includes("crise") || normalized.includes("saf")) score += 22;
    if (normalized.includes("estadio") || normalized.includes("ct")) score += 18;
    return clamp(score, 0, 100);
  }

  function communicationRepercussion(impact, category) {
    if (impact.institutional < 0 || impact.financial < 0) return "sensivel";
    if (category === "Pedido de desculpas") return "reparadora";
    if (impact.institutional > 0 || impact.financial > 0 || impact.sporting > 0) return "positiva";
    return "moderada";
  }

  function quotaFromForm(form, assignId = true) {
    const data = Object.fromEntries(new FormData(form).entries());
    const position = SPONSOR_POSITIONS.find((item) => item.id === data.position) || SPONSOR_POSITIONS[0];
    return {
      id: assignId ? uid("quota") : "preview",
      name: data.name || "Cota",
      positionId: position.id,
      positionLabel: position.label,
      quantity: Math.max(1, Math.floor(toNumber(data.quantity) || 1)),
      remaining: Math.max(1, Math.floor(toNumber(data.quantity) || 1)),
      askValue: Math.max(0, toNumber(data.askValue)),
      durationMonths: Math.max(1, Math.floor(toNumber(data.durationMonths) || 1)),
      exclusive: data.exclusive === "yes",
      mandatoryGoals: data.mandatoryGoals || "",
      bonusGoals: data.bonusGoals || "",
      penalties: data.penalties || "",
      createdAt: Clock.iso(),
    };
  }

  function createSponsorQuota(form) {
    const quota = quotaFromForm(form);
    const position = SPONSOR_POSITIONS.find((item) => item.id === quota.positionId);
    if (!isSponsorPositionAvailable(position)) {
      toast("Esta cota exige uma instalacao existente, em obra ou contrato ativo.");
      return;
    }
    quota.estimatedValue = estimateQuotaValue(quota);
    state.sponsorships.quotas.unshift(quota);
    addEvent({
      type: "sponsorship",
      title: "Cota de patrocinio criada",
      description: `${quota.name} criada com valor pedido de ${money(quota.askValue)}.`,
    });
    form.reset();
    toast("Cota criada.");
  }

  function estimateQuotaValue(quota) {
    const position = SPONSOR_POSITIONS.find((item) => item.id === quota.positionId) || SPONSOR_POSITIONS[0];
    const reps = state.reputations;
    const repFactor = 0.45
      + (reps.institutional.value / 10) * 0.35
      + (reps.financial.value / 10) * 0.25
      + (reps.sporting.value / 10) * 0.18;
    const durationFactor = Math.max(0.18, quota.durationMonths / 12);
    const exclusivityFactor = quota.exclusive ? 1.08 : 1;
    const mandatoryCount = quota.mandatoryGoals ? quota.mandatoryGoals.split(",").filter(Boolean).length : 0;
    const goalsFactor = Math.max(0.84, 1 - mandatoryCount * 0.03);
    return position.base * repFactor * durationFactor * exclusivityFactor * goalsFactor;
  }

  function generateSponsorProposals(quotaId) {
    const quota = state.sponsorships.quotas.find((item) => item.id === quotaId);
    if (!quota || quota.remaining <= 0) return;
    const count = sponsorCompanyCount();
    const companies = COMPANY_NAMES.slice().sort(() => Math.random() - 0.5).slice(0, count);
    const proposals = companies.map((company, index) => buildSponsorProposal(quota, company, index));
    state.sponsorships.proposals.unshift(...proposals);
    addEvent({
      type: "sponsorship",
      title: "Empresas ficticias avaliadas",
      description: `${companies.length} empresa(s) analisaram a cota ${quota.name}.`,
    });
    toast("Propostas simuladas.");
  }

  function sponsorCompanyCount() {
    const value = state.reputations.institutional.value;
    if (value < 1) return randomInt(0, 1);
    if (value < 2) return randomInt(1, 2);
    if (value < 3) return randomInt(2, 3);
    if (value < 5) return randomInt(3, 5);
    return randomInt(5, 10);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function buildSponsorProposal(quota, company, index) {
    const estimated = estimateQuotaValue(quota) * (0.94 + index * 0.025);
    const ratio = quota.askValue / estimated;
    const blocked = state.reputations.financial.value < 0.5 || state.reputations.institutional.value < 0.5;
    let status = "offered";
    let interest = "Interesse normal";
    let reason = "Valor dentro do limite estimado.";
    let amount = quota.askValue;

    if (blocked) {
      status = "rejected";
      interest = "Bloqueado por reputacao";
      reason = "Reputacao institucional ou financeira abaixo do minimo.";
      amount = 0;
    } else if (ratio <= 0.8) {
      interest = "Forte interesse";
    } else if (ratio <= 1) {
      interest = "Interesse normal";
    } else if (ratio <= 1.15) {
      interest = "Negociacao";
      reason = "Empresa fez contraproposta pelo valor estimado.";
      amount = estimated;
    } else if (ratio <= 1.3) {
      status = "rejected";
      interest = "Interesse muito baixo";
      reason = "Preco acima do limite de risco comercial.";
      amount = 0;
    } else {
      status = "rejected";
      interest = "Rejeicao automatica";
      reason = "Preco acima de 130% do valor estimado.";
      amount = 0;
    }

    if (state.club.legalModel === "saf" && amount > 0) {
      amount *= 1.3;
      reason += " Bonus SAF de 30% aplicado.";
    }

    return {
      id: uid("proposal"),
      quotaId: quota.id,
      quotaName: quota.name,
      company,
      status,
      interest,
      reason,
      amount,
      askValue: quota.askValue,
      estimatedValue: estimated,
      durationMonths: quota.durationMonths,
      createdAt: Clock.iso(),
      expiresAt: addDays(Clock.iso(), 7),
    };
  }

  function acceptProposal(id) {
    const proposal = state.sponsorships.proposals.find((item) => item.id === id);
    if (!proposal || proposal.status !== "offered") return;
    const quota = state.sponsorships.quotas.find((item) => item.id === proposal.quotaId);
    if (!quota || quota.remaining <= 0) {
      toast("Cota sem disponibilidade.");
      return;
    }
    proposal.status = "accepted";
    quota.remaining -= 1;
    const contract = {
      id: uid("contract"),
      quotaId: quota.id,
      quotaName: quota.name,
      company: proposal.company,
      amount: proposal.amount,
      startAt: Clock.iso(),
      endAt: addMonths(Clock.iso(), proposal.durationMonths),
      status: "active",
    };
    state.sponsorships.contracts.unshift(contract);
    addCash(proposal.amount, "Patrocinio aceito", `${proposal.company} fechou a cota ${quota.name}.`, "sponsorship");
    applyReputationChange("financial", PROVISIONAL_REPUTATION_IMPACTS.sponsorshipAcceptedFinancial, "Contrato de patrocinio aceito.");
    toast("Contrato de patrocinio ativo.");
  }

  function rejectProposal(id) {
    const proposal = state.sponsorships.proposals.find((item) => item.id === id);
    if (!proposal || proposal.status !== "offered") return;
    proposal.status = "rejected";
    addEvent({
      type: "sponsorship",
      title: "Proposta rejeitada",
      description: `${proposal.company} foi recusada na cota ${proposal.quotaName}.`,
    });
  }

  function applyStaffFilters(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    state.staff.filters = Object.fromEntries(
      Object.entries(data).filter(([, value]) => String(value || "").trim() !== "")
    );
  }

  function refreshStaffMarket() {
    state.staff.market = STAFF_ROLE_CATALOG.map((role, index) => createMarketProfessional(role, state.club, index));
    state.staff.filters = {};
    state.staff.draftProfessionalId = null;
    addStaffHistory({
      professionalName: "Mercado de profissionais",
      event: "Nova lista simulada gerada",
      financialImpact: 0,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
    addEvent({
      type: "staff",
      title: "Mercado de funcionarios atualizado",
      description: "Uma nova lista local de profissionais ficticios foi gerada.",
    });
    toast("Mercado de profissionais atualizado.");
  }

  function setProfessionalStatus(id, status, eventLabel) {
    const professional = state.staff.market.find((item) => item.id === id);
    if (!professional || professional.status === "hired") return;
    professional.status = status;
    addStaffHistory({
      professionalName: professional.name,
      event: eventLabel,
      financialImpact: 0,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
  }

  function openStaffProposal(id) {
    const professional = state.staff.market.find((item) => item.id === id);
    if (!professional || professional.status === "rejected" || professional.status === "hired") return;
    state.staff.draftProfessionalId = id;
    professional.status = professional.status === "available" ? "observed" : professional.status;
    currentView = "staff";
    currentStaffTab = "hiring";
    state.staff.activeTab = "hiring";
    setPrototypeRoute("/escritorio/funcionarios/contratacoes");
  }

  function sendStaffProposal(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const candidate = state.staff.market.find((item) => item.id === data.professionalId);
    const role = staffRoleById(data.roleId);
    if (!candidate || !role) {
      toast("Selecione um profissional e um cargo.");
      return;
    }
    const startAt = data.startAt ? new Date(data.startAt).toISOString() : Clock.iso();
    const offer = {
      roleId: role.id,
      salary: Math.max(0, toNumber(data.salary)),
      durationMonths: Math.max(1, Math.floor(toNumber(data.durationMonths) || 1)),
      bonus: Math.max(0, toNumber(data.bonus)),
      terminationPenalty: Math.max(0, toNumber(data.terminationPenalty)),
      goals: data.goals || "",
      structure: data.structure || "office",
      startAt,
    };
    const result = evaluateStaffProposal(candidate, offer);
    const proposal = {
      id: uid("staff-proposal"),
      professionalId: candidate.id,
      professionalName: candidate.name,
      candidateSnapshot: JSON.parse(JSON.stringify(candidate)),
      roleId: role.id,
      roleLabel: role.label,
      offer,
      status: result.status,
      score: result.score,
      reason: result.reason,
      answer: result.reason,
      counterSalary: result.counterSalary || null,
      createdAt: Clock.iso(),
      expiresAt: addDays(Clock.iso(), 5),
    };
    state.staff.proposals.unshift(proposal);

    if (result.status === "accepted") {
      hireStaffFromProposal(proposal, result);
    } else {
      addStaffHistory({
        professionalName: candidate.name,
        event: `Proposta enviada: ${result.status}`,
        financialImpact: 0,
        sportingImpact: 0,
        institutionalImpact: 0,
      });
      addEvent({
        type: "staff",
        title: "Proposta enviada a funcionario",
        description: `${candidate.name} respondeu: ${result.reason}`,
      });
    }
    toast("Proposta processada.");
  }

  function resolveStaffProposal(id) {
    const proposal = state.staff.proposals.find((item) => item.id === id);
    if (!proposal || proposal.status !== "waiting") return;
    const result = evaluateStaffProposal(proposal.candidateSnapshot, proposal.offer, true);
    if (result.status === "accepted") {
      hireStaffFromProposal(proposal, result);
    } else if (result.status === "counteroffer") {
      proposal.status = "counteroffer";
      proposal.counterSalary = result.counterSalary;
      proposal.answer = result.reason;
    } else {
      proposal.status = "rejected";
      proposal.answer = result.reason;
      addStaffHistory({
        professionalName: proposal.professionalName,
        event: "Proposta recusada",
        financialImpact: 0,
        sportingImpact: 0,
        institutionalImpact: 0,
      });
    }
  }

  function acceptStaffCounter(id) {
    const proposal = state.staff.proposals.find((item) => item.id === id);
    if (!proposal || proposal.status !== "counteroffer") return;
    proposal.offer.salary = proposal.counterSalary;
    hireStaffFromProposal(proposal, { reason: "Contraproposta aceita pelo clube." });
  }

  function cancelStaffProposal(id) {
    const proposal = state.staff.proposals.find((item) => item.id === id);
    if (!proposal || !["waiting", "counteroffer"].includes(proposal.status)) return;
    proposal.status = "cancelled";
    proposal.answer = "Proposta cancelada pelo clube.";
    addStaffHistory({
      professionalName: proposal.professionalName,
      event: "Proposta cancelada",
      financialImpact: 0,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
  }

  function hireStaffFromProposal(proposal, result = {}) {
    if (proposal.hiredEmployeeId) return true;
    const candidate = state.staff.market.find((item) => item.id === proposal.professionalId) || proposal.candidateSnapshot;
    const role = staffRoleById(proposal.offer.roleId);
    if (!candidate || !role) return false;
    if (role.officeRequired && getAdminCapacity() - getOfficeRequiredStaffCount() <= 0) {
      proposal.status = "rejected";
      proposal.answer = "Contratacao bloqueada por falta de sala administrativa.";
      toast("Falta capacidade de sala administrativa.");
      return false;
    }
    if (proposal.offer.bonus > 0 && !spendCash(proposal.offer.bonus, "Bonus de contratacao pago", `${candidate.name} recebeu bonus de assinatura.`, "staff")) {
      proposal.status = "waiting";
      proposal.answer = "Aceite condicionado ao pagamento do bonus; caixa insuficiente no momento.";
      return false;
    }
    const employee = {
      id: uid("employee"),
      professionalId: candidate.id,
      name: candidate.name,
      age: candidate.age,
      nationality: candidate.nationality,
      city: candidate.city,
      state: candidate.state,
      roleId: role.id,
      roleLabel: role.label,
      groupId: role.group,
      salary: proposal.offer.salary,
      contractStartAt: proposal.offer.startAt,
      contractEndAt: addMonths(proposal.offer.startAt, proposal.offer.durationMonths),
      nextSalaryAt: addMonths(proposal.offer.startAt, 1),
      bonus: proposal.offer.bonus,
      terminationPenalty: proposal.offer.terminationPenalty,
      goals: proposal.offer.goals,
      level: staffLevelFromAttributes(candidate.attributes).label,
      attributes: { ...candidate.attributes },
      performance: clamp(52 + candidate.reputation * 7 + randomInt(-8, 8), 20, 95),
      moral: clamp(68 + randomInt(-8, 12), 20, 100),
      workload: clamp(role.required ? 82 + randomInt(0, 18) : 62 + randomInt(0, 20), 30, 125),
      workplace: staffWorkplaceLabel(role, proposal.offer.structure),
      managerName: suggestedManagerName(role.id),
      evolution: 0,
      status: "active",
      hiredAt: Clock.iso(),
    };
    state.staff.employees.unshift(employee);
    const marketProfessional = state.staff.market.find((item) => item.id === candidate.id);
    if (marketProfessional) marketProfessional.status = "hired";
    proposal.status = "accepted";
    proposal.answer = result.reason || "Proposta aceita.";
    proposal.hiredEmployeeId = employee.id;
    addStaffHistory({
      professionalName: employee.name,
      event: `Contratacao como ${employee.roleLabel}`,
      financialImpact: -proposal.offer.bonus,
      sportingImpact: role.group === "coaches" || role.group === "technical" ? 1 : 0,
      institutionalImpact: candidate.reputation >= 3.5 ? PROVISIONAL_REPUTATION_IMPACTS.notableStaffHireInstitutional : 0,
    });
    if (candidate.reputation >= 3.5) {
      applyReputationChange("institutional", PROVISIONAL_REPUTATION_IMPACTS.notableStaffHireInstitutional, "Contratacao de profissional reconhecido.");
    }
    addEvent({
      type: "staff",
      title: "Funcionario contratado",
      description: `${employee.name} assumiu o cargo de ${employee.roleLabel}.`,
      financialImpact: -proposal.offer.bonus,
    });
    return true;
  }

  function staffWorkplaceLabel(role, structure) {
    if (role.officeRequired) return "Sala administrativa";
    if (structure === "ct") return "Centro de treinamento";
    if (structure === "stadium") return "Estadio";
    if (role.group === "medical") return hasMedicalFacility() ? "Instalacao medica" : "Campo municipal";
    if (role.group === "operations") return hasCtSignal() ? "Instalacoes do clube" : "Campo municipal";
    return "Estrutura do clube";
  }

  function suggestedManagerName(roleId) {
    const role = staffRoleById(roleId);
    if (!role) return "";
    const managerByGroup = {
      coaches: "Diretor de futebol",
      technical: "Diretor de futebol",
      medical: "Gerente administrativo",
      administrative: "Presidencia",
      operations: "Gestor de patrimonio",
    };
    return getActiveStaff().find((employee) => employee.roleLabel === managerByGroup[role.group])?.name || managerByGroup[role.group] || "";
  }

  function renewStaff(id) {
    const employee = state.staff.employees.find((item) => item.id === id && item.status === "active");
    if (!employee) return;
    employee.contractEndAt = addMonths(employee.contractEndAt, 12);
    employee.salary = Math.round(employee.salary * 1.06);
    employee.moral = clamp(employee.moral + 4, 0, 100);
    addStaffHistory({
      professionalName: employee.name,
      event: "Contrato renovado por 12 meses",
      financialImpact: 0,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
    addEvent({
      type: "staff",
      title: "Contrato de funcionario renovado",
      description: `${employee.name} renovou contrato por mais 12 meses.`,
    });
  }

  function promoteStaff(id) {
    const employee = state.staff.employees.find((item) => item.id === id && item.status === "active");
    if (!employee) return;
    employee.salary = Math.round(employee.salary * 1.12);
    employee.moral = clamp(employee.moral + 6, 0, 100);
    employee.performance = clamp(employee.performance + 2, 0, 100);
    employee.workload = clamp(employee.workload + 6, 0, 135);
    addStaffHistory({
      professionalName: employee.name,
      event: "Promocao interna simulada",
      financialImpact: 0,
      sportingImpact: 1,
      institutionalImpact: 0,
    });
  }

  function fireStaff(id) {
    const employee = state.staff.employees.find((item) => item.id === id && item.status === "active");
    if (!employee) return;
    const penalty = Math.min(employee.terminationPenalty || employee.salary * 2, employee.salary * 3);
    if (penalty > 0 && !spendCash(penalty, "Rescisao de funcionario", `${employee.name} foi desligado do clube.`, "staff")) return;
    employee.status = "fired";
    employee.firedAt = Clock.iso();
    const professional = state.staff.market.find((item) => item.id === employee.professionalId);
    if (professional) professional.status = "available";
    addStaffHistory({
      professionalName: employee.name,
      event: "Desligamento",
      financialImpact: -penalty,
      sportingImpact: -1,
      institutionalImpact: 0,
    });
    addEvent({
      type: "staff",
      title: "Funcionario desligado",
      description: `${employee.name} deixou o clube.`,
      financialImpact: -penalty,
    });
  }

  function startStaffDevelopment(id) {
    const employee = state.staff.employees.find((item) => item.id === id && item.status === "active");
    if (!employee) return;
    if (state.staff.development.some((item) => item.employeeId === employee.id && item.status === "in_progress")) return;
    if (!spendCash(PROVISIONAL_STAFF_COURSE_COST, "Curso de funcionario iniciado", `${employee.name} iniciou desenvolvimento profissional.`, "staff-development")) return;
    const role = staffRoleById(employee.roleId);
    const area = staffDevelopmentArea(role?.area || "Gestao");
    state.staff.development.unshift({
      id: uid("staff-development"),
      employeeId: employee.id,
      employeeName: employee.name,
      areaKey: area.key,
      areaLabel: area.label,
      gain: 5,
      cost: PROVISIONAL_STAFF_COURSE_COST,
      status: "in_progress",
      startAt: Clock.iso(),
      endAt: addDays(Clock.iso(), PROVISIONAL_STAFF_COURSE_DAYS),
    });
    addStaffHistory({
      professionalName: employee.name,
      event: `Curso iniciado em ${area.label}`,
      financialImpact: -PROVISIONAL_STAFF_COURSE_COST,
      sportingImpact: 0,
      institutionalImpact: 0,
    });
  }

  function staffDevelopmentArea(areaLabel) {
    const map = {
      Tecnica: ["technical", "tecnica"],
      Tatica: ["tactical", "tatica"],
      Fisica: ["fitness", "fisica"],
      Medica: ["medical", "medica"],
      Analise: ["analysis", "analise"],
      Lideranca: ["leadership", "lideranca"],
      Negociacao: ["negotiation", "negociacao"],
      Financas: ["finances", "financas"],
      Marketing: ["marketing", "marketing"],
      Gestao: ["management", "gestao"],
      Observacao: ["scouting", "observacao"],
      "Desenvolvimento de jovens": ["youthDevelopment", "desenvolvimento de jovens"],
    };
    const [key, label] = map[areaLabel] || map.Gestao;
    return { key, label };
  }

  function acquireAdminRoom(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const option = ADMIN_ROOM_OPTIONS.find((item) => item.id === data.optionId) || ADMIN_ROOM_OPTIONS[0];
    const mode = data.mode;
    const cost = mode === "purchase" ? option.purchase : option.rent;
    startConstruction({
      kind: "admin-room",
      title: `${mode === "purchase" ? "Compra" : "Aluguel"} de sala - ${option.label}`,
      cost,
      buildUntil: addDays(Clock.iso(), 1),
      payload: { optionId: option.id, mode },
    });
  }

  function buyLand(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const zone = LAND_ZONES.find((item) => item.id === data.zoneId) || LAND_ZONES[0];
    const area = Math.max(1, Math.floor(toNumber(data.area)));
    const price = zone.priceM2 * area;
    if (!spendCash(price, "Terreno comprado", `${number(area)} m2 em ${zone.label}.`, "land")) return;
    state.facilities.lands.push({
      id: uid("land"),
      zoneId: zone.id,
      zoneLabel: zone.label,
      area,
      priceM2: zone.priceM2,
      price,
      monthlyMaintenance: price * 0.015,
      status: "active",
      acquiredAt: Clock.iso(),
      nextChargeAt: addMonths(Clock.iso(), 1),
    });
    toast("Terreno registrado no patrimonio.");
  }

  function calculateCtBuild(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const facility = CT_FACILITIES.find((item) => item.id === data.typeId) || CT_FACILITIES[0];
    const level = data.level || "simples";
    const adminZone = ADMIN_ROOM_OPTIONS.find((item) => item.id === data.adminCostZone) || ADMIN_ROOM_OPTIONS[0];
    const roomCount = clamp(Math.floor(toNumber(data.roomCount) || 3), 3, 20);
    let cost = facility.costs?.[level] || 0;
    let area = facility.area;
    let displayName = facility.names?.[level] || facility.label;
    let capacity = facility.capacities?.[level] || null;

    if (facility.special === "admin-room-ct") {
      cost = adminZone.purchase * 0.7;
      area = 80;
      capacity = 6;
      displayName = `Sala administrativa no CT - ${adminZone.label}`;
    }

    if (facility.special === "admin-building-ct") {
      cost = adminZone.purchase * 0.5 * roomCount;
      area = 360;
      capacity = roomCount * 6;
      displayName = `Predio administrativo no CT - ${roomCount} salas`;
    }

    return {
      typeId: facility.id,
      label: facility.label,
      displayName,
      level,
      cost,
      area,
      capacity,
      buildDays: facility.buildDays,
      benefit: facility.benefit,
      landId: data.landId,
      monthlyMaintenance: cost * 0.015,
    };
  }

  function buildCtFacility(form) {
    const build = calculateCtBuild(form);
    if (!build.landId) {
      toast("Selecione um terreno.");
      return;
    }
    if (getLandFreeArea(build.landId) < build.area) {
      toast("Area insuficiente no terreno selecionado.");
      return;
    }
    startConstruction({
      kind: "ct-facility",
      title: `CT - ${build.displayName}`,
      cost: build.cost,
      buildUntil: addDays(Clock.iso(), build.buildDays),
      payload: build,
    });
  }

  function simulateMunicipalStadiumMatch(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const crowd = Math.max(0, Math.floor(toNumber(data.crowd)));
    const ticket = Math.max(0, toNumber(data.ticketPrice));
    const gross = crowd * ticket;
    const variableCost = gross * 0.2;
    const totalCost = 1016.38 + variableCost;
    const net = gross - totalCost;
    state.finance.cash += net;
    state.facilities.stadium.rentals.unshift({
      id: uid("rental"),
      date: Clock.iso(),
      crowd,
      ticket,
      gross,
      totalCost,
      net,
    });
    addEvent({
      type: "municipal-stadium",
      title: "Partida simulada no estadio municipal",
      description: `Publico de ${number(crowd)} pessoas. Renda bruta ${money(gross)} e custo ${money(totalCost)}.`,
      financialImpact: net,
    });
    toast("Partida simulada registrada.");
  }

  function calculateStadiumBuild(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const module = STADIUM_MODULES.find((item) => item.seats === Number(data.seats)) || STADIUM_MODULES[0];
    const level = data.level || "simples";
    const mode = data.mode || "expand";
    const oldModule = state.facilities.stadium.modules.find((item) => item.id === data.reformOfId);
    const ignoreModuleId = mode === "reform" ? oldModule?.id : null;
    const seats = module.seats;
    const seatCost = module.costs[level];
    const cost = seats * seatCost;
    const landId = data.landId || oldModule?.landId;
    const requiredArea = getStadiumRequiredArea(landId, seats, ignoreModuleId);
    return {
      mode,
      landId,
      reformOfId: mode === "reform" ? data.reformOfId : null,
      seats,
      level,
      seatCost,
      cost,
      weeks: module.weeks,
      requiredArea,
      monthlyMaintenance: cost * 0.015,
    };
  }

  function buildStadiumModule(form) {
    const build = calculateStadiumBuild(form);
    const land = state.facilities.lands.find((item) => item.id === build.landId);
    if (!land) {
      toast("Selecione um terreno.");
      return;
    }
    if (build.mode === "reform" && !build.reformOfId) {
      toast("Selecione o modulo que sera reformado.");
      return;
    }
    const nonStadiumUsage = getLandUsage(build.landId) - getStadiumRequiredArea(build.landId);
    if (land.area - nonStadiumUsage < build.requiredArea) {
      toast("Terreno insuficiente para a area minima do estadio.");
      return;
    }
    startConstruction({
      kind: "stadium-module",
      title: `${build.mode === "reform" ? "Reforma" : "Modulo"} de estadio - ${number(build.seats)} lugares`,
      cost: build.cost,
      buildUntil: addDays(Clock.iso(), build.weeks * 7),
      payload: build,
    });
  }

  function startTryout(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const cost = Math.max(0, toNumber(data.cost));
    if (cost > 0 && !spendCash(cost, "Peneira iniciada", `Perfil: ${data.profile}.`, "tryout")) return;
    if (cost === 0) {
      addEvent({
        type: "tryout",
        title: "Peneira iniciada",
        description: `Perfil: ${data.profile}. Sem custo opcional.`,
      });
    }
    state.constructions.push({
      id: uid("work"),
      kind: "tryout",
      title: "Peneira de atletas",
      cost,
      status: "in_progress",
      startAt: Clock.iso(),
      endAt: addMinutes(Clock.iso(), PROVISIONAL_TRYOUT_DURATION_MINUTES),
      payload: { profile: data.profile },
    });
    toast("Peneira iniciada.");
  }

  function generateYouth() {
    const quality = calculateYouthQuality().total;
    const players = generatePlayers(4, "base", quality);
    state.players.youth.unshift(...players);
    addEvent({
      type: "youth-academy",
      title: "Jovens ficticios gerados",
      description: `${players.length} jovem(ns) criados para teste de qualidade da base.`,
    });
    toast("Jovens gerados.");
  }

  function generatePlayers(count, origin, qualityBase = 30) {
    return Array.from({ length: count }, () => {
      const current = clamp(qualityBase * 0.35 + randomInt(8, 38), 5, 82);
      const potential = clamp(current + randomInt(8, 42), current, 96);
      const age = origin === "base" ? randomInt(15, 18) : randomInt(17, 27);
      return {
        id: uid("player"),
        name: `${FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)]}`,
        position: POSITIONS[randomInt(0, POSITIONS.length - 1)],
        age,
        current,
        potential,
        development: potential - current > 30 ? "Rapido" : potential - current > 18 ? "Moderado" : "Lento",
        origin,
        cityBorn: Math.random() > 0.45 ? state.club.city : "Cidade vizinha",
      };
    });
  }

  function hirePlayer(id) {
    const index = state.players.tryoutFindings.findIndex((player) => player.id === id);
    if (index < 0) return;
    const [player] = state.players.tryoutFindings.splice(index, 1);
    state.players.squad.push({ ...player, hiredAt: Clock.iso() });
    addEvent({
      type: "player",
      title: "Atleta contratado",
      description: `${player.name} passou a integrar o elenco principal.`,
    });
  }

  function promoteYouth(id) {
    const index = state.players.youth.findIndex((player) => player.id === id);
    if (index < 0) return;
    const [player] = state.players.youth.splice(index, 1);
    state.players.squad.push({ ...player, promotedAt: Clock.iso() });
    addEvent({
      type: "player",
      title: "Jovem promovido",
      description: `${player.name} foi promovido da base para o elenco principal.`,
    });
  }

  function simulateInternalTraining(mode) {
    const required = mode === "full" ? 22 : 10;
    if (state.players.squad.length < required) {
      toast(`Sao necessarios ${required} atletas.`);
      return;
    }
    const injured = Math.random() < 0.12;
    const evolved = randomInt(1, Math.min(3, state.players.squad.length));
    addEvent({
      type: "training-match",
      title: mode === "full" ? "Jogo-treino completo interno" : "Treino reduzido interno",
      description: `${evolved} atleta(s) tiveram evolucao leve. ${injured ? "Uma lesao leve foi simulada." : "Nenhuma lesao registrada."}`,
    });
    toast("Jogo-treino interno registrado.");
  }

  function resetPrototype() {
    const confirmed = window.confirm("Apagar todos os dados locais e reiniciar o prototipo?");
    if (!confirmed) return;
    localStorage.removeItem(STORAGE_KEY);
    state = createEmptyState();
    currentView = "setup";
    render();
  }

  function tick() {
    if (!state.club) {
      updateLivePieces();
      return;
    }
    const changes = processWorldProgress(false);
    if (changes.length) {
      saveState();
      render();
      return;
    }
    updateLivePieces();
  }

  function toast(message) {
    const region = document.querySelector("#toast-region");
    if (!region) return;
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    region.appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  document.addEventListener("submit", handleSubmit);
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", updateEstimators);
  window.addEventListener("beforeunload", () => {
    if (state.club) saveState();
  });

  if (state.club) {
    const changes = processWorldProgress(true);
    saveState();
  }
  render();
  setInterval(tick, 1000);
})();
