import express,{Request,Response} from 'express';
import { CustomRequest, authMiddleware } from '../middleware';
import { Posts, PrismaClient } from '@prisma/client';
import z, { number } from 'zod';
import StatusCodes from '../StatusCodes';
import { create } from 'domain';
import {PostsSchemaZod} from "@amartya_gupta/medium_type";
import cors from 'cors';

const PostsRouter = express.Router();
const prisma = new PrismaClient();

PostsRouter.use(express.json());
PostsRouter.use(cors());



type PostsSchema = z.infer<typeof PostsSchemaZod>;
type SinglePostSchema = Pick<PostsSchema,'title' | 'body' | 'tags'>;
type BodyType = Pick<PostsSchema,'title' | 'body' | 'userId'>




PostsRouter.get('/yourposts/:page',authMiddleware,async (req:CustomRequest,res:Response) => {
   const Id = req.id as string;
   const page = Number(req.params.page as string);
   let skipPosts;
   if(page > 0){
      skipPosts = 10 * (page - 1);
   }else if(page == 0){
      skipPosts = 0;
   }else{
      return res.status(StatusCodes.BADREQUEST).json({
         message:"page entered is negative"
      })
   }
   console.log(skipPosts + " hi");

   try{
      const posts = await prisma.posts.findMany({
         select:{
            id:true,
            title:true,
            body:true,
            createdAt:true,
            user:{
               select:{
                  username:true
               }
            }
         },
         take:10,
         skip:skipPosts,
         where:{
            userId:Number(Id)
         }
      })

      if(posts == null){
         return res.status(StatusCodes.NOT_FOUND).json({
            message : "something went wrong"
         })
      }
      console.log(posts);
      return res.json({
         posts
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }

   
})
PostsRouter.get('/allposts',authMiddleware,async (req:Request,res:Response) => {
   const page = Number((req.query.count as string));
   
   const title = req.query.title as string;
   let SkipPosts;
   if(page != 0){
      SkipPosts = 10 * (page - 1);
   }else{
      SkipPosts = 0;
   }
   
   try{
      const posts = await prisma.posts.findMany({
         take:10,
         skip:SkipPosts,
         where:{
            title:{
               contains: title
            }
         },
         select:{
            id:true,  
            title:true,
            body:true,
            createdAt:true,
            user:{
               select:{
                  username:true
               }
            }
         }
      });
      return res.json({
         posts
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
})



PostsRouter.get('/:id',authMiddleware,async (req:Request,res:Response) => {
   console.log(req.params.id);
   const Id = Number(req.params.id);
   console.log('hi');
   console.log(Id + "osljdlfsodljflsdjx");
   try{
      const post = await prisma.posts.findFirst({
         where:{
            id:Id
         },
         select:{
            id:true,  
            title:true,
            body:true,
            createdAt:true,
            user:{
               select:{
                  username:true
               }
            }
         }
      })
      if(!post){
         res.status(StatusCodes.NOT_FOUND).json({
            message : 'no post with this id'
         })
      }
      res.status(StatusCodes.OK).json({
         post:post
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
})






PostsRouter.post('/',authMiddleware,async (req:CustomRequest,res:Response) => {
   const Id = Number(req.id as string);
    
   if(!Id){
      return res.json({
         message : "not number"
      })
   }

   try{
      const AvailableTags = await prisma.tags.findMany();
      const {title,body,tags}:SinglePostSchema = req.body;
      const TagsNeeded = AvailableTags.filter(t => {
            return tags.includes(t.tag);
      })
      const newPost = await prisma.posts.create({
         data: {
            title,
            body,
            user: {
               connect: {
                  id: Number(Id)
               },
            },
            tags: {
               create: TagsNeeded.map(t => ({
                  tag: {
                    connect: {
                      id: t.id,
                    },
                  },
               })),
           },
         },
         include:{
            tags:true
         }
      });
   
      res.status(StatusCodes.OK).json({
         id: newPost.id
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
   
})

PostsRouter.get('/:filter',authMiddleware,async (req:CustomRequest,res:Response) => {
   const filter = req.params.filter as string;
   const Id = req.id as string;
   try{
      const post = await prisma.posts.findMany({
         where:{
            title:{
               contains: filter
            }
         },
         select: {
            id: true,
            title: true,
          }
      });
      if(!post){
         return res.json({
            message : "post doesn't exist"
         })
      }
      return res.json({
         post
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
   
})

PostsRouter.put('/:postid',authMiddleware,async (req:CustomRequest,res:Response) => {
   const id = req.params.postid as string;
   const {title,body}:BodyType = req.body;
   const Id = req.id as string;
   try{
      const PostToUpdate = await prisma.posts.update({
         where:{
            id:Number(id),
            userId:Number(Id)
         },
         data:{
            title,
            body
         }
        
      })
      if(!PostToUpdate){
         return res.json({
            message : "post doesn't exist"
         })
      }
      return res.json({
         title : PostToUpdate.title,
         body:PostToUpdate.body
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
   
})

PostsRouter.delete('/:postid',authMiddleware,async (req:CustomRequest,res:Response) => {
   const Id = req.id as string;
   const id = req.params.postid as string;
   try{
      const IsOwner = await prisma.posts.findFirst({
         where:{
            userId:{
               equals:Number(Id)
            },
            id:{
               equals:Number(id)
            }
         },
      })
      if(!IsOwner){
         return res.json({
            message : `you are the owner of the post with postId ${id}`
         })
      }
      await prisma.posts.delete({
         where:{
            id:Number(id),
            userId:Number(Id)
         }
      })
      return res.json({
         message : "post deleted successfully"
      })
   }catch(error){
      console.log(error);
      res.status(StatusCodes.BAD_GATEWAY).json({
          message : "can't connect to database"
      })
   }
   
})

export default PostsRouter;