import test from 'node:test';
import assert from 'node:assert/strict';
import { postInput, commentInput, mediaUrlSchema } from '../src/members/validation.ts';
test('member media rejects executable and insecure URLs',()=>{
 for(const url of ['javascript:alert(1)','http://example.com/a.jpg','//example.com/a.jpg','/\\example.com/a.jpg','https://user:secret@example.com/a.jpg'])assert.equal(mediaUrlSchema.safeParse(url).success,false,url);
 for(const url of ['','/images/example.webp','https://example.com/video.mp4'])assert.equal(mediaUrlSchema.safeParse(url).success,true,url);
});
test('member publishing validates category requirements and bounds',()=>{
 const p={title:'Uma nova ideia',body:'Conteúdo original para a comunidade.',kind:'novidade',status:'draft'};
 assert.equal(postInput.safeParse(p).success,true);
 assert.equal(postInput.safeParse({...p,kind:'prompt'}).success,false);
 assert.equal(postInput.safeParse({...p,kind:'video'}).success,false);
 assert.equal(postInput.safeParse({...p,status:'public'}).success,false);
 assert.equal(postInput.safeParse({...p,body:'x'.repeat(30001)}).success,false);
 assert.equal(postInput.safeParse({...p,kind:'prompt',prompt:'Crie três ideias.'}).success,true);
});
test('member comments validate identity and cannot set moderation state',()=>{
 const c={postId:'11111111-1111-4111-8111-111111111111',name:'Criador',body:'Minha contribuição',status:'approved',userId:'forged'};
 assert.equal(commentInput.parse(c).status,undefined);
 assert.equal(commentInput.parse(c).userId,undefined);
 assert.equal(commentInput.safeParse({...c,body:' '}).success,false);
 assert.equal(commentInput.safeParse({...c,postId:'invalid'}).success,false);
});
