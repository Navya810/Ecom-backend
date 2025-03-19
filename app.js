const express = require(`express`);
const app = express();
const{User}= require (`./model/User`);
const mongoose = require('mongoose');
const cors =require('cors');
const morgan =require('morgan');
const bcrypt=require('bcryptjs');
const jwt =require('jsonwebtoken');
const{Product}=require('./model/Product');
const {Cart}=require ('./model/Cart');

//middlewave
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

//jL5DfQ9jq7pjAdh6

let MONGODB_URL = "mongodb+srv://navyakukanur:jL5DfQ9jq7pjAdh6@cluster0.waom0.mongodb.net/?retryWrites=true&w=majority"

mongoose.connect(MONGODB_URL)
.then(()=>{
    console.log("DB is connected")
}).catch((err)=>{
    console.log("db is not connected",err)
})
//task -1 create route
app.post('/register',async(req,res)=>{
    try{
        let{name,email,password}=req.body;

        if(!email ||!password||!name){
            return res.status(400).json({message:"some fields are missing"});
        }

        //check if the user already exists
        const isUserAlreadyExist =await User.findOne({email});

        if(isUserAlreadyExist){
            res.status(400).json({message:"User already registered"});
            return;
        }else{
            //Hash the password
            const salt =bcrypt.genSaltSync(10);
            const hashedPassword =bcrypt.hashSync(password,salt);
            //generate JWT token
            const token =jwt.sign({email},"supersecret",{expiresIn:"365d"});
            //create user in database
            await User.create({
                name,
                email,
                password:hashedPassword,
                token,
                role:"user",
            });
            return res.status(201).json({
                message:"User created successfully"
            });

        }
    }catch(error){
        console.log("Internal Server error",error);
    }
})
//task 2 create for login
app.post('/login',async(req,res)=>{
    try{
        let{email,password}=req.body;


        if(!email||!password){
            return res.status(400).json({
                message:"some Fields are missing"
            })
        }

        //check user exist or not
        const user =await User.findOne({email});

        if(!user){
return res.status(400).json({
    message:"User is not registered.Please register first"
})
        }
        //compare password
        const isPasswordMatched =bcrypt.compareSync(password,user.password);

        if(!isPasswordMatched){
            return res.status(400).json({
                message:"Invalid password"
            })
        }
        return res.status(200).json({
            id:user._id,
            name:user.name,
            token:user.token,
            email:user.email,
            role:user.role,
        })

    }catch(error){
            console.log("Error during login",error);
            return res.status(500).json({message:"Internal Server Error"});
        }
    }
)
//task 3
app.get('/products',async(req,res)=>{
    try{
const products =await Product.find();
res.status(200).json({message:"product found successfully",
    products:products
})
    }catch(error){
    console.log(error);
    return res.status(500).json({message:"Internal Server Error"});
}
})


//task 4
app.post('/add-product',async(req,res)=>{
    try{
        const{name,image,price,description,stock,brand}=req.body;
        const{token}=req.headers;
        const decodedtoken=jwt.verify(token,"supersecret");
        const user=await User.findOne({email:decodedtoken.email});
        const product =await Product.create({
            name,
            description,
            image,
            price,
            stock,
            brand,
            user:user._id
        })
        return res.status(201).json({
            message:"Product created successfully",
            product:product
        })
        
    }catch(error){
    console.log(error);
    return res.status(500).json({message:"Internal Server Error"});
}
})
//task 5
app.get('/product/:id',async(req,res)=>{
    try{
        let{id}=req.params;
        if(!id){
            res.status(400).json({
                message:"Product Id not found"
            });
        }
        const{token}=req.headers;
        const decodedtoken=jwt.verify(token,"supersecret");

        if(decodedtoken.email){
            const product =await Product.findById(id);

            if(!product){
                res.status(400).json({
                    message:"Product not found"
                });
            }
            res.status(200).json({
                message:"success",product
            });
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Internal Server Error"});
    }
})

//task 6
app.patch("/product/edit/:id", async (req, res) => {
    try {
        const { name, description, image, price, brand, stock } = req.body.productData;
        const { id } = req.params;
        const { token } = req.headers;
        
        // Verify JWT token
        const decodedToken = jwt.verify(token, "supersecret");

        // Check if the email in the decoded token matches
        if (decodedToken.email) {
            const updatedProduct = await Product.findByIdAndUpdate(id, {
                name,
                description,
                image,
                price,
                brand,
                stock,
            }, { new: true }); // { new: true } ensures the updated document is returned.

            return res.status(200).json({
                message: "Product updated successfully",
                product: updatedProduct
            });
        } else {
            return res.status(401).json({ message: "Unauthorized" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//task7
app.delete("/product/delete/:id:",async(req,res)=>{

    try{
        const{id}=req.params;
        if(!id){
            return res.status(400).send("Product Id not found");
        }
        const deletedProduct = await Product.findByIdAndDelete(id);
        
        if(!deletedProduct){
            return res.status(400).sendStatus("Product not found");
        }
        res.sendStatus(200).json({
            message:"Product Deleted Successfully",
            product:deletedProduct,
        })
    }catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        





    
    
    }
})

//task 8
app.get("/cart",async(req,res)=>{
    try{
        const{token}=req.headers;
        const decodedToken =jwt.verify(token,"supersecret");
        const user =await User.findOne({email:decodedToken.email}).populate({
        path:"cart",
        populate:{
            path:"products",
            model:"Products",
        },
        });
        if(!user){
            return res.status(400).send("User Not found");
        }
        res.status(200).json({cart:user.cart});

        }catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        
    }
    
})

//task 9
app.post("/cart/add",async(req,res)=>{
    try{
        const body =req.body;
        const productsArray=body.products;
        let totalPrice=0;


        for(const item of productsArray){
            const product =await Product.findById(item);
            if(product){
                totalPrice+=product.price;
            }
        }
        const{token}=req.headers;
        const decodedToken =jwt.verify(token,"supersecret");
        const user =await User.findOne({email:decodedToken.email});
        if(!user){
            return res.status(404).json({message:"User not Found"});
        }
        let cart;
        if(user.cart){
            cart =await Cart.findById(user.cart).populate("products");
            const existingProductIds =cart.products.map((product)=>
            product_id.toString());

        productsArray.forEach(async(productId)=>{
            if(!existingProductIds.includes(productId)){
                cart.products.push(productId);
                const product =await product.findById(productId);
                totalPrice += product.price;
            }
        });
        cart.total=totalPrice;
        await cart.save();
    }
     else {
        cart=new Cart({
            products:productsArray,
            total:totalPrice,
        });
        await cart.save();
        user.cart =cart._id;
        await user.save();
    }
    res.status(201).json({
        message:"Cart Updated Successfully",
        cart:cart,
    });

}catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal Server Error" });
        
    }
})

//task 10 

        app.delete("/cart/product/delete", async (req, res)=> {
            const { productID }= req.body;
            const { token } = req.headers;
            try {
            const decodedToken = jwt.verify(token, "supersecret");
            const user = await User.findOne({ email: decodedToken.email }).populate("cart")
            if (!user) {
            return res.status(404).json({ message: "User Not Found" });
            }
        
            const cart = await Cart.findById(user.cart).populate("products");
            if (!cart) {
            return res.status(404).json({ message: "Cart Not Found" });
            }
        
            const productIndex = cart.products.findIndex(
            (product)=>product._id.toString() === productID
            );
        
            if (productIndex ===-1){
            return res.status(404).json({ message: "Product Not Found in Cart" });
            }
               cart.products.splice(productIndex, 1);
               cart.total = cart.products.reduce(
            (total, product)=> total + product.price,
            0
            );
            await cart.save();
        
               res.status(200).json({
            message: "Product Removed from Cart Successfully",
            cart: cart,});
        
            } catch (error) {
               res.status(500).json({ message: "Error Removing Product from Cart", error });
            }
            })
      
     let PORT = 8080;
app.listen(PORT,()=>{
    console.log(`server is connected port: ${PORT}`)
})