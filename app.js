//Define configurações iniciais
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const { render } = require("ejs");
const e = require("express");
const app = express();
const port = 3000; //Porta que será usada

let clienteEmail = null; //Variavel que guarda o email do cliente que está usando a conta
let clienteCPF = null; //Guarda o CPF do cliente
let clienteSenha = null; //Guarda a senha do clinpdente

// Configura o banco de dados MySQL
const connection = mysql.createConnection({
    host: "localhost", // Nome do servidor
    user: "root", // Usuário do servidor
    password: "senia", // Senha do servidor
    database: "canvas", // Nome do banco de dados
});

//Avisa se a conexão foi bem sucedida
connection.connect((err) => {
    if(err){
        console.log("Erro ao conectar ao MySQL: " + err.stack); //Isso será impresso no console no caso de erro
        return;
    }

    console.log("Conectado ao MySQL com ID " + connection.threadId); //Isso será ipresso no console no caso de sucesso
});//Fim

//Configura o express
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//Fim


//Rotas
//Rota principal chama index.ejs
app.get('/', (req, res) => {
    res.render('index'); //Rederiza a pagina index.ejs no navegador
});//Fim

app.get('/cadastro', (req, res) => {
    res.render("cadastro.ejs");
});

// Rota para a página de cadastro
app.post('/cadastro', (req, res) => {
    const { nome_completo, email, senha, cpf } = req.body; // Esses dados vão vir do formulário que o usuário digitou

    connection.query('SELECT * FROM CLIENTE WHERE email = ? OR cpf = ?', [email, cpf], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao verificar usuário. Por favor, tente novamente.');
            return;
        }

        if (results.length > 0) {
            res.send('Email ou CPF já cadastrado. Por favor, escolha outro.');
        } else {
            const usuario = { nome_completo, email, senha, cpf };

            connection.query('INSERT INTO CLIENTE SET ?', usuario, (err, results) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Erro ao cadastrar usuário. Por favor, tente novamente.');
                    return;
                }
                res.redirect('/login');
            });
        }
    });
});

//rota para pagina sobre
app.get('/sobre', (req, res) => {
    res.render("sobre.ejs");
});

//Rota para pagina Login
app.get('/planos', (req, res) => {
    res.render('planos');
});

// Rota para a página de login
app.get("/login", (req, res) => {
    res.render("login.ejs"); // Renderiza a página login.ejs no navegador
});

app.post('/login', (req, res) => {
    const {EMAIL, SENHA } = req.body; //Traz do formulario o email e a senha do usuario
    clienteEmail = EMAIL; //Salva o email do usuario
    clienteSenha = SENHA;

    //Comando select para saber se as informações que o usuario digitou estão no banco de dados
    connection.query(
        'SELECT * FROM CLIENTE WHERE email = ? AND senha = ?', [EMAIL, SENHA],
        (err, results) => {
            if(err) throw err;
  
            //Se estiver certo sera redirecionado para a pagina que mostra a lista de pacotes de viagem
            if(results.length > 0){
                res.redirect('/planos');
            }else{
                res.send('Credenciais inválidas!');
            }
        }
    );
});//Fim

app.get('/canvas', (req, res) => {
    res.render("CANVAS.ejs");
});
app.get('/payment', (req, res) => {
    res.render("payment.ejs");
});

// Rota para processar o pagamento
app.post('/payment', (req, res) => {
    const { metodoPagamento } = req.body;

    console.log('Dados recebidos na rota /payment:', req.body);

    // Verificação básica dos dados recebidos
    if (!metodoPagamento) {
        return res.status(400).send('Metodo de pagamento não fornecido');
    }

    // Consultar se o método de pagamento já existe
    connection.query(
        'SELECT id_metodoPag FROM metodo_pagamento WHERE nome_metodoPag = ?',
        [metodoPagamento],
        (err, results) => {
            if (err) {
                console.error('Erro ao consultar método de pagamento:', err);
                res.status(500).send('Erro ao consultar método de pagamento');
                return;
            }

            let metodoPagamentoId;

            if (results.length > 0) {
                // Método de pagamento já existe, pegar o id_metodoPag existente
                metodoPagamentoId = results[0].id_metodoPag;
                // Inserir o id_metodoPag no usuário
                connection.query(
                    'UPDATE cliente SET id_metodoPag = ? WHERE email = ?',
                    [metodoPagamentoId, req.session.email],
                    (err2, result) => {
                        if (err2) {
                            console.error('Erro ao atualizar método de pagamento do cliente:', err2);
                            res.status(500).send('Erro ao atualizar método de pagamento do cliente');
                        } else {
                            console.log('Método de pagamento do cliente atualizado com sucesso.');
                            res.status(200).send('Método de pagamento do cliente atualizado com sucesso.');
                            // Redirecionar para a página /canvas após a atualização
                            res.redirect('/canvas');
                        }
                    }
                );
            } else {
                // Método de pagamento não existe, inserir novo método de pagamento
                connection.query(
                    'INSERT INTO metodo_pagamento (nome_metodoPag) VALUES (?)',
                    [metodoPagamento],
                    (err3, result) => {
                        if (err3) {
                            console.error('Erro ao inserir método de pagamento:', err3);
                            res.status(500).send('Erro ao inserir método de pagamento');
                        } else {
                            metodoPagamentoId = result.insertId;
                            // Inserir o id_metodoPag no usuário
                            connection.query(
                                'UPDATE cliente SET id_metodoPag = ? WHERE email = ?',
                                [metodoPagamentoId, req.session.email],
                                (err4, result) => {
                                    if (err4) {
                                        console.error('Erro ao atualizar método de pagamento do cliente:', err4);
                                        res.status(500).send('Erro ao atualizar método de pagamento do cliente');
                                    } else {
                                        console.log('Método de pagamento do cliente atualizado com sucesso.');
                                        res.status(200).send('Método de pagamento do cliente atualizado com sucesso.');
                                        // Redirecionar para a página /canvas após a atualização
                                        res.redirect('/canvas');
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    );
});


app.listen(3000, () => {
    console.log('SERVIDOR ATIVO, ACESSE http://localhost:3000');
    });