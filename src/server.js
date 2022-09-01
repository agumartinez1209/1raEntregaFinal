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

productosRouter.get('/', async (req, res) => { 
    res.json(await productosApi.getAll())
})
productosRouter.get('/:id', async (req, res) => { 
            res.json( await productosApi.listar(req.params.id))
})
productosRouter.post('/', soloAdmins, async (req, res) => { 
        res.json(await productosApi.guardar(req.body))
})
productosRouter.put('/:id', soloAdmins, async (req, res) => { 
        res.json(await productosApi.actualizar(req.body , req.params.id))
})
productosRouter.delete('/:id', soloAdmins, async (req, res) => { 
        res.json(await productosApi.borrar(req.params.id))    
})

//--------------------------------------------
// configuro router de carritos

const carritosRouter = new Router()

carritosRouter.use(express.json())
carritosRouter.use(express.urlencoded({extended:true}))

carritosRouter.post('/', async(req, res)=>{
    res.json(await carritosApi.guardar(req.body))
})
carritosRouter.delete('/:id', async (req, res) => { 
    res.json(await carritosApi.borrar(req.params.id))    
})
carritosRouter.get('/:id/productos', async (req, res) => { 
    res.json(await carritosApi.listar(req.params.id))
})
carritosRouter.post('/:id/productos/:id_prod', async (req, res) => { 
    const carrito = await carritosApi.listar(req.params.id);
    carrito['productos'].push( await productosApi.listar(req.params.id_prod))
    res.json(await carritosApi.actualizar(carrito,req.params.id))
})
carritosRouter.delete('/:id/productos/:id_prod', async (req, res) => {
    const carrito = await carritosApi.listar(req.params.id);
    const indexId = carrito['productos'].findIndex(p => p.id == req.params.id_prod )
    carrito['productos'].splice( indexId  , 1);
   res.json(await carritosApi.actualizar(carrito,req.params.id))
})

//--------------------------------------------
// configuro el servidor

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use('/api/productos', productosRouter)
app.use('/api/carritos', carritosRouter)

module.exports = app