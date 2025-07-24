const NOME_DA_ABA = "Cifras";

// Lida com pedidos de DADOS (GET), como buscar a lista de músicas ou uma cifra específica.
function doGet(e) {
  try {
    const action = e.parameter.action || 'getMusicas'; // Define getMusicas como ação padrão
    let result = {};

    if (action === 'getMusicas') {
      result = getMusicas();
    } else if (action === 'getCifra') {
      result = getCifraPorId(e.parameter.id);
    } else {
      throw new Error("Ação GET inválida.");
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Lida com o ENVIO de dados (POST), como adicionar uma nova cifra.
function doPost(e) {
  try {
    const dadosFormulario = JSON.parse(e.postData.contents);
    const newSongData = adicionarNovaCifra(dadosFormulario);
    
    return ContentService.createTextOutput(JSON.stringify(newSongData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function obterAba() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_DA_ABA);
  if (!sheet) { throw new Error(`Aba da planilha com o nome "${NOME_DA_ABA}" não foi encontrada!`); }
  return sheet;
}

function getMusicas() {
  const sheet = obterAba();
  if (sheet.getLastRow() < 2) return []; 
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2);
  const values = range.getValues();
  return values.map(row => {
    if (row[0] && row[1]) {
      return { id: `${row[0]} - ${row[1]}`, titulo: row[0], artista: row[1] };
    }
  }).filter(item => item);
}

function getCifraPorId(id) {
  const sheet = obterAba();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentId = `${row[0]} - ${row[1]}`;
    if (currentId === id) { return { cifra: row[2] }; }
  }
  return { cifra: "Música não encontrada." };
}

function adicionarNovaCifra(dadosFormulario) {
  // MODIFICAÇÃO 1: Adicionamos "nomeUsuario" para extraí-lo dos dados recebidos.
  const { titulo, artista, cifraBruta, nomeUsuario } = dadosFormulario; 

  const cifraJson = converterCifraParaJson(cifraBruta);
  const sheet = obterAba();

  // MODIFICAÇÃO 2: Adicionamos a variável "nomeUsuario" para ser salva na 4ª coluna.
  sheet.appendRow([titulo, artista, cifraJson, nomeUsuario]); 

  return { status: "sucesso", novaMusica: { id: `${titulo} - ${artista}`, titulo: titulo, artista: artista } };
}

function isPalavraDeAcorde(palavra) {
  if (!palavra) return true;
  if (palavra.startsWith('[') && palavra.endsWith(']')) return true;
  if (palavra.startsWith('(') && palavra.endsWith(')')) return true;
  const notaRegex = /^[A-G](b|#)?/;
  if (!notaRegex.test(palavra)) return false;
  const restoDaPalavra = palavra.replace(notaRegex, '');
  const caracteresValidosRegex = /^[mMajJdDiIsSuUgGaAdD0-9#b()/,-\s]*$/;
  return caracteresValidosRegex.test(restoDaPalavra);
}

function isLinhaDeAcordes(linha) {
    linha = linha.trim();
    if (linha === '') return false;
    const palavras = linha.split(/\s+/);
    return palavras.every(isPalavraDeAcorde);
}

function converterCifraParaJson(textoCifra) {
  const linhas = textoCifra.trim().split('\n');
  const resultado = [];
  let i = 0;
  while (i < linhas.length) {
    const linhaAtual = linhas[i];
    if (linhaAtual.trim() === '') {
        i++;
        continue;
    }
    const proximaLinha = (i + 1 < linhas.length) ? linhas[i + 1] : null;
    if (isLinhaDeAcordes(linhaAtual)) {
      if (proximaLinha && !isLinhaDeAcordes(proximaLinha) && proximaLinha.trim() !== '') {
        resultado.push({ acordes: linhaAtual, letra: proximaLinha });
        i += 2;
      } else {
        resultado.push({ acordes: linhaAtual, letra: '' });
        i += 1;
      }
    } else {
      resultado.push({ acordes: '', letra: linhaAtual });
      i += 1;
    }
  }
  return JSON.stringify(resultado);
}