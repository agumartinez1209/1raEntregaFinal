
const { response } = require("express");
const express = require("express");
const { Router } = express;

//--------------------------------------------
// instancio servidor y persistencia

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//--------------------------------------------
// Routers

const routerProductos = new Router();
routerProductos.use(express.json()); 
routerProductos.use(express.urlencoded({ extended: true })); 

app.use("/api/productos", routerProductos); 

const routerCarrito = new Router();
routerCarrito.use(express.json()); 
routerCarrito.use(express.urlencoded({ extended: true })); 

app.use("/api/carrito", routerCarrito); 

//--------------------------------------------
// permisos de administrador

const esAdmin = true;

function crearErrorNoEsAdmin(ruta, metodo) {
    const error = {
        error: -1,
    };
    if (ruta && metodo) {
        error.descripcion = `ruta '${ruta}' metodo '${metodo}' no autorizado`;
    } else {
        error.descripcion = "no autorizado";
    }
    return error;
}

function soloAdmins(req, res, next) {
    if (!esAdmin) {
        res.json(crearErrorNoEsAdmin());
    } else {
        next();
    }
}

//--------------------------------------------
// Import containers

const Contenedor = require("./contenedores/Contenedor");

const productos = new Contenedor("dbProductos.json");
const carrito = new Contenedor("dbCarrito.json");

//--------------------------------------------
// productos

async function verProductos() {
    return await productos.getAll();
}

routerProductos.get("/", async (req, res) => {
    res.json(await verProductos());
});


async function productoId(id) {
    
    return await productos.getbyId(id);
}

routerProductos.get("/:id", async (req, res) => {
    const { id } = req.params;
    if (await productoId(id)) {
        
        res.json(await productoId(parseInt(id))); 
    } else {
        res.json({ error: "producto no encontrado" });
    }
});



async function postProducto(prod) {
    
    return await productos.save(prod);
}

routerProductos.post("/", soloAdmins, async (req, res) => {
    const prod = req.body; 
    prod.timestamp = Date.now();
    prod.stock = 20;
    prod.descripcion = "A new product"
    res.json(await postProducto(prod)); 
});


async function actualizarProds(arr) {
    
    return await productos.saveProduct(arr);
}

routerProductos.put("/:id", soloAdmins, async (req, res) => {
    const { id } = req.params;
    const newProduct = req.body;
    const producto = await productoId(parseInt(id)); 
    const prods = await verProductos(); 
    const index = prods.findIndex((prod) => {
        
        return prod.id == producto.id;
    });
    if (index >= 0) {
        prods[index] = newProduct; 
        newProduct.id = producto.id; 
        newProduct.timestamp = Date.now();
        await actualizarProds(prods); 
        res.send(`El producto: ${JSON.stringify(producto)} \n\n
        Fue reemplazado por : ${JSON.stringify(newProduct)}`);
    } else {
        res.sendStatus(400);
    }
});



async function deleteProducto(id) {
    return await productos.deleteById(id);
}

routerProductos.delete("/:id", soloAdmins, async (req, res) => {
    const { id } = req.params; 
    res.json(await deleteProducto(parseInt(id))); 
});

//--------------------------------------------
// carrito



async function createNew(obj) {
    return await carrito.save(obj);
}

routerCarrito.post("/", async (req, res) => {
    try {
        const carrito = {}; 
        carrito.timestamp = Date.now(); 
        carrito.productos = []; 
        res.json(await createNew(carrito));
    } catch (error) {
        console.log(error);
    }
});



async function deleteCarrito(id) {
    return await carrito.deleteById(id);
}

routerCarrito.delete("/:id", async (req, res) => {
    const { id } = req.params;
    res.json(await deleteCarrito(parseInt(id))); 
});



async function carritoId(id) {
    return await carrito.getbyId(id);
}

routerCarrito.get("/:id/productos", async (req, res) => {
    const id = req.params.id; 
    const carritoElegido = await carritoId(parseInt(id)); 

    res.send(carritoElegido.productos); 
});



routerCarrito.post("/:id/productos", async (req, res) => {
    const { id } = req.params;
    const prodId = req.body.id;

    const producto = await productoId(parseInt(prodId)); 
    const carritoElegido = await carritoId(parseInt(id)); 

    carritoElegido.productos.push(producto); 

    const carts = await carrito.getAll(); 
    const index = carts.findIndex((carrito) => {
        
        return carrito.id == carritoElegido.id;
    });
    if (index >= 0) {
        carts[index] = carritoElegido; 

        await carrito.saveProduct(carts); 
        res.json(carts);
    } else {
        res.sendStatus(400);
    }
});



routerCarrito.delete("/:id/productos/:idProd", async (req, res) => {
    const { id, idProd } = req.params;

    const carritoElegido = await carritoId(parseInt(id));

    const carritoSinProd = carritoElegido.productos.filter(prod => prod.id !== parseInt(idProd))
    const carts = await carrito.getAll(); 
    const index = carts.findIndex((carrito) => {
        
        return carrito.id == carritoElegido.id;
    });
    if (index >= 0) {
        carts[index].productos = carritoSinProd; 

        await carrito.saveProduct(carts);  
        res.json(carts);
    } else {
        res.sendStatus(400);
    }
});



routerCarrito.get('/', async(req , res) => {
    const listaCarrito = await carrito.getAll();
    const lista = [];
    for (const item of listaCarrito) {
        lista.push(item.id)
    }
    console.log(lista);
    res.json(lista);
});

routerCarrito.get('/:id', async(req, res) => {
    const { id } = req.params;
    const cart = carrito.getbyId(id);

})

//--------------------------------------------
// Inicio servidor


const PORT = 8080;

const server = app.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${server.address().port}`);
});
server.on("error", (error) => console.log(`Error en servidor ${error}`));