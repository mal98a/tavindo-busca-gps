//var request = require('request');
var http = require('http');
//var db = require('./db');
//var Util = require('./util');
var Immutable = require('immutable');
var socket = require('socket.io-client').connect('http://localhost:' + (process.env.PORT || 3000));

//var sockets = {};

var counterA = 0;
var counterB = 0;
var ultimaDataHora = Infinity;
var busList = Immutable.Map({});

var loadGPS = function() {
  var options = {
    hostname: 'dadosabertos.rio.rj.gov.br',
    path: '/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  };

  http.get(options, (res) => {
    var body = '';
    
    res.setEncoding('utf8');
    
    res.on('data', partialBody => {
      body += partialBody;
    });
    
    res.on('end', () => {
      var data = JSON.parse(body);
      console.log('>>> inicio', counterA++, new Date());
      
      parseData(data.DATA);
      /*
      var stmtLinha = "INSERT INTO linha (linha, id_municipio) SELECT $1, 1 WHERE NOT EXISTS (SELECT 1 FROM linha WHERE linha = $2)";
      var stmtGPS = 'INSERT INTO gps (dataHora, ordem, id_linha, lat, lon, velocidade) SELECT $1, $2, (SELECT id FROM linha WHERE linha = $3), $4, $5, $6 WHERE NOT EXISTS (SELECT id FROM gps WHERE dataHora = $7 AND ordem = $8)';
      
      var client = new db.Client(db.connString);
      client.on('drain', client.end.bind(client));
      client.connect(function(err, connection, done) {
        if(err) {
          console.log('err', err);
          throw err;
        }
      
        for(var i=0; i<data.DATA.length; i++) {
          var registro = data.DATA[i];
          var temp = registro[0].split(' ')[0].split('-');
          var dados = {
            dataHora: temp[2] + '-' + temp[0] + '-' + temp[1] + ' ' + registro[0].split(' ')[1],
            ordem: registro[1],
            linha: registro[2] + '',
            lat: registro[3],
            lon: registro[4],
            velocidade: registro[5]
          };
          
          if(dados.linha == '') {
            continue;
          }
          
          connection.query(stmtLinha, [dados.linha, dados.linha], function(err, rows, fields) {
            if (err) {
              console.log('err:', err);
              throw err;
            }
          });
          
          if(dados.dataHora < ultimaDataHora) {
            continue;
          }
          
          ultimaDataHora = dados.dataHora;
          
          var callbackFor = function(_dados) {
            return function(err, result) {
              if(err) {
                console.log('err', err);
                throw err;
              }
              
              console.log('result', result);
            };
          };
          
          connection.query(stmtGPS, [dados.dataHora, dados.ordem, dados.linha, dados.lat, dados.lon, dados.velocidade, dados.dataHora, dados.ordem], callbackFor(dados));
        }
        
        connection.query('SELECT count(*) AS total FROM gps', function (err, result) {
          if(err) {
            console.log('err:', err);
            throw err;
          } else {
            console.log('rows(', counterB, new Date(), '):', result.rows);
            console.log('<<< fim', counterB++, new Date());
          }
        });
      });
      */
    });
  }).on('error', err => {
    console.log('err', err);
    throw err;
  });
};

var parseData = (loadedData) => {
  for(var i=0; i<loadedData.length; i++) {
    var row = loadedData[i];
    var dados = Immutable.Map({
      dataHora: row[0],
      ordem: row[1],
      linha: row[2] + '',
      lat: row[3],
      lon: row[4]
    });
    
    if(dados.get('linha') == '422') {
      console.log('busList[' + dados.get('ordem') + ']', busList[dados.get('ordem')]);
      console.log('dados', dados);
      console.log('busList[' + dados.get('ordem') + '].equals(dados)', busList.get(dados.get('ordem')).equals(dados));
    }
    
    if(!busList[dados.ordem] || !busList[dados.ordem].equals(dados)) {
      socket.emit('bus.update', dados);
      busList[dados.ordem] = dados;
    }
  }
};

setTimeout(loadGPS, 1);
setInterval(loadGPS, 45 * 1000);