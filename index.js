import Parser from 'rss-parser';
import { Resend } from 'resend';

// Inicializa o cliente do Resend usando a chave segura do GitHub
const resend = new Resend(process.env.RESEND_API_KEY);
const parser = new Parser();

// 1. INSIRA AQUI OS FEEDS RSS DOS SITES QUE VOCÊ QUER ACOMPANHAR
const FEEDS = [
  //'https://tabnews.com.br/recentes/rss', // Exemplo: Tabnews
  'https://g1.globo.com/dynamo/tecnologia/rss2.xml' // Exemplo: G1 Tecnologia
];

async function executarCuradoria() {
  let htmlConteudo = '';
  
  console.log('Iniciando coleta de notícias...');

  for (const url of FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      htmlConteudo += `<h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; font-family: sans-serif;">${feed.title}</h2>`;
      
      // Pega apenas as 3 últimas notícias de cada feed para evitar e-mails gigantescos
      const ultimosItens = feed.items.slice(0, 3);
      
      for (const item of ultimosItens) {
        const dataPublicacao = item.pubDate ? new Date(item.pubDate).toLocaleDateString('pt-BR') : 'Hoje';
        
        htmlConteudo += `
          <div style="margin-bottom: 20px; font-family: sans-serif;">
            <h3 style="margin-bottom: 5px;"><a href="${item.link}" style="color: #1e1b4b; text-decoration: none; font-weight: bold;">${item.title}</a></h3>
            <small style="color: #6b7280;">Publicado em: ${dataPublicacao}</small>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">${item.contentSnippet || 'Clique no link para ler o artigo completo.'}</p>
          </div>
        `;
      }
    } catch (erro) {
      console.error(`Erro ao ler o feed ${url}:`, erro.message);
    }
  }

  // 2. CONFIGURAÇÃO DO ENVIO DO EMAIL
  if (htmlConteudo !== '') {
    try {
      console.log('Enviando e-mail via Resend...');
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Domínio padrão gratuito do Resend
        to: 'davi08elias@gmail.com',
        subject: `🗞️ Seu Filtro Diário de Notícias - ${new Date().toLocaleDateString('pt-BR')}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <h1 style="text-align: center; color: #111827; font-family: sans-serif;">Sua Curadoria Sem Ruído</h1>
            <p style="text-align: center; color: #4b5563; font-family: sans-serif;">Aqui está o que importa hoje, livre de hypes.</p>
            <hr style="border: 0; height: 1px; background: #333; background-image: linear-gradient(to right, #ccc, #333, #ccc); margin-bottom: 30px;">
            ${htmlConteudo}
          </div>
        `
      });
      console.log('E-mail enviado com sucesso!');
    } catch (erroEmail) {
      console.error('Erro ao enviar e-mail:', erroEmail.message);
    }
  } else {
    console.log('Nenhum conteúdo coletado.');
  }
}

executarCuradoria();
