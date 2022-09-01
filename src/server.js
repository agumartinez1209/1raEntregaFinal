const express = require('express')
const { Router } = express

const ContenedorArchivo = require('./contenedores/ContenedorArchivo.js')

//--------------------------------------------
// instancio servidor y persistencia

const app = express()

const productosApi = new ContenedorArchivo('dbProductos.json')
const carritosApi = new ContenedorArchivo('dbCarritos.json')

//--------------------------------------------
// permisos de administrador

const esAdmin = true

function crearErrorNoEsAdmin(ruta, metodo) {
    const error = {
        error: -1,
    }
    if (ruta && metodo) {
        error.descripcion = `ruta '${ruta}' metodo '${metodo}' no autorizado`
    } else {
        error.descripcion = 'no autorizado'
    }
    return error
}

function soloAdmins(req, res, next) {
    if (!esAdmin) {
        res.json(crearErrorNoEsAdmin())
    } else {
        next()
    }
}

//--------------------------------------------
// configuro router de productos

const productosRouter = new Router()

productosRouter.use(express.json());
productosRouter.use(express.urlencoded({extended:true}));

productosRouter.get('/productos', soloAdmins,async  (req, res) => {
    try {
        const prod = await productosApi.getAll();
        res.json(prod);
    } catch (error) {
        console.log(error);
    }
});

productosRouter.get('/productos/:id',soloAdmins ,existe, async (req, res) => {
    const id = req.params.id;
    const prod = await productosApi.getById(id)
    console.log('aca probamos el id ' + id);
    res.json(prod);
});

productosRouter.post('/productos',soloAdmins, (req, res) => {
    try {
        prod = req.body;
        prod.timestamp = Date.now();
        productosApi.save(prod);
        res.json(req.body);
    } catch (error) {
        console.log(error);
    }
});

productosRouter.put('/productos/:id',soloAdmins ,existe,(req, res)=> {
    try {
        console.log(req.body, req.params.id);
        productosApi.update(req.body, req.params.id);
        res.send(productosApi.getAll());
    } catch (error) {
        console.log(error);
    }
});

productosRouter.delete('/productos/:id', existe, (req, res) => {
    try {
        const id = req.params.id;
        productosApi.deleteById(id);
        res.json(productosApi.getAll());
    } catch (error) {
        console.log(error);
    }
})

//--------------------------------------------
// configuro router de carritos

const carritosRouter = new Router()

carritosRouter.use(express.json())
carritosRouter.use(express.urlencoded({extended:true}))

carritosRouter.post('/carrito', async (req, res) => {
    try {
       const carrito = {};
       carrito.timestamp = Date.now();
       carrito.productos = []; 
       res.json(await carritosApi.save(carrito));
    } catch (error) {
      console.log(error);  
    }
})

carritosRouter.delete('/carrito/:id', (req, res) => {
    try {
        const id = req.params.id;
        carritosApi.deleteById(id);
        res.json(carritosApi.getAll());
    } catch (error) {
        console.log(error);
    }
})

carritosRouter.get('/carrito/:id/productos', async (req, res) => {
    try {
        const id = req.params.id;
        const carrito = await carritosApi.getById(id);
        res.json(carrito); 
    } catch (error) {
        console.log(error);
    }
   
})

carritosRouter.get('/carrito', async (req, res) => {
    try {
        const carritos = await carritosApi.getAll();
        res.json(carritos);
    } catch (error) {
       console.log(error); 
    }
})

carritosRouter.get('/carrito/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const carritos = await carritosApi.getById(id);
        res.json(carritos);
    } catch (error) {
       console.log(error); 
    }
})

carritosRouter.post('/carrito/:id/productos', async (req, res) => {
  try {
    const id = req.params.id;
    const prod = req.body.id;
    const miprod = await productosApi.getById(prod);
    const carritos = await carritosApi.getById(id);
    carritos.productos.push(miprod);
    carritosApi.update(carritos, id);
    res.json(carritos);
  } catch (error) {
    console.log(error)
  }
})

carritosRouter.delete('/carrito/:id/productos/:id_prod', (req, res) => {
    try {
        const id = req.params.id;
        const idProd = req.params.id_prod;
        const carrito = carritosApi.getById(id);
        const prod = carrito.productos.filter(p => p.id != parseInt(idProd));
        carrito.productos = prod;
        carritosApi.update(carrito, id);
    } catch (error) {
        console.log(error);
    }
    
})


carritosRouter.delete('/carrito', async (req, res) => {
    try {
        carritosApi.deleteAll();
    } catch (error) {
        console.log(error)
    }
})

//--------------------------------------------
// configuro el servidor

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use('/api/productos', productosRouter)
app.use('/api/carritos', carritosRouter)

module.exports = app