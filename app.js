if(process.env.NODE_ENV != 'production'){
require('dotenv').config();
}
const express= require('express');
const app= express();
const multer  = require('multer')
const {storage}= require("./cloudConfig.js");
const upload = multer({ storage});

const plantValidation= require('./PlantValidation.js');
const path= require('path');
const ejsMate= require('ejs-mate');
const mongoose= require('mongoose');
const Plant= require('./Models/Plants');
const expressError= require('./expressError.js');
const flash= require('connect-flash');
const Review= require('./Models/review.js')
const dbUrl= process.env.ATLASDB_URL;
async function connect(){
    await mongoose.connect(dbUrl);
}
connect().then(console.log("Database connected"))
.catch((err)=>console.log(err));

const session= require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({  secret: '@ffj6y', resave: false, saveUninitialized: true}));
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(flash());

app.engine('ejs', ejsMate);
app.use(express.urlencoded({extended:true}));
app.set("View engine", 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const port= 8080;
app.listen(port, ()=>{
    console.log("Port is listening");
});


app.get("/", (req, res)=>{
    res.render("pages/Home.ejs");
});
app.get("/initiatives", (req, res)=>{
    res.render("pages/Initiative.ejs")
});
app.get("/events", (req, res)=>{
    res.render("pages/events.ejs");
});
app.get("/plants", async(req, res)=>{
    let Plants= await Plant.find();
    res.render("pages/plantation.ejs", {Plants, success: req.flash('success'), error: req.flash('error') });
});
app.get("/plant/:id", async(req, res)=>{
    let {id}= req.params;
    let plant=await Plant.findById(id);
    res.render("pages/detail.ejs",{plant})
});
app.get("/about", (req, res)=>{
    res.render("pages/about_us.ejs");
});
app.get('/password', (req, res)=>{
    res.render('pages/password.ejs');
});
app.post('/newPlant', (req, res)=>{
    let {password}= req.body;
    if(password=='@ffj6y'){
        res.render('pages/new.ejs');
    }else{
        req.flash('error', "You can not add plants.")
        res.redirect("/plants");
    }
});
app.post('/plants', upload.single('Plant[image]'), async(req, res)=>{
  let result= plantValidation.validate(req.body);
  if(result.error){
    throw new expressError(400, result.error)
  }else{
  let {path, filename}= req.file;
  const new_plant= new Plant(req.body.Plant);
  new_plant.image= {url:path, filename:filename};
  await new_plant.save();
  req.flash('success', "New Plant added");
  res.redirect('/plants');}
});
app.get('/exhibition', (req, res)=>{
   res.render('pages/exhibition.ejs', {success: req.flash('success')});
});
app.post('/feedback', async(req, res)=>{
    let {feedback}= req.body;
    const new_review= new Review(req.body.feedback);
    await new_review.save();
    req.flash('success', 'Thank You for your valuable Feedback!')
    res.redirect('/exhibition');
});
app.use(()=>{
   throw new expressError(404, "Page not found!");
});
app.use((err, req, res, next)=>{
    let {status=500, message="Some error occured"}= err;
    res.status(status).render('pages/error.ejs', {message});
});
