import{y as se,r as p,d as Q,x as de,m as Y,a as n,o as G,c as H,w as t,b as e,i as R,h as N,A as Z,k as W,l as ee,n as ue,p as ie,t as re,e as J,C as te,z as ce,u as me,g as _e,B as ve,s as pe,v as fe}from"./index-B8Co8WN0.js";import{_ as ye}from"./UnsavedChangesDialog.vue_vue_type_script_setup_true_lang-CzR3Qi1m.js";import{u as ge}from"./use-validation-rules-CHIpKI1C.js";import{l as X}from"./lodash-xep2xpXO.js";import{u as ae,E as ke}from"./Editor-CPWW-YmR.js";import{u as Ve}from"./use-books-CWF24FlN.js";import{_ as we}from"./ConfirmationDialog.vue_vue_type_script_setup_true_lang-DjVES1-H.js";import{_ as be}from"./_plugin-vue_export-helper-DlAUqK2U.js";const x=se.service("endorsements"),w=p([]);x.on("patched",m=>{const k=w.value.findIndex(v=>v.id===m.id);w.value.splice(k,1,m)});x.on("created",m=>{w.value.push(m)});x.on("removed",m=>{const k=w.value.findIndex(v=>v.id===m.id);w.value.splice(k,1)});x.on("updated",m=>{const k=w.value.findIndex(v=>v.id===m.id);w.value.splice(k,1,m)});function xe(){return{endorsements:w,emptyEndorsement:()=>({fk_book:0,date:"",by:"",text:"",notes:""}),findEndorsements:async d=>{const z=await x.find({query:d});return w.value=z.data,w},getEndorsement:async d=>await x.get(d),saveEndorsement:async d=>"id"in d?await x.patch(d.id,d):await x.create(d),removeEndorsement:async d=>{await x.remove(d)}}}const Ee=Q({__name:"EndorsementEditDialog",props:{show:{type:Boolean},endorsement:{}},emits:["save","cancelled"],setup(m,{emit:k}){const{baseEditorInit:v}=ae(),E=m,C=k,d=p(E.endorsement),z={...v,setup:function(b){b.on("copy",function(r){var _;(_=r.clipboardData)==null||_.setData("text/plain",b.selection.getContent()),r.preventDefault()})}};de(()=>{d.value=E.endorsement});const $=Y(()=>E.show);function I(){C("save",d.value)}function B(){C("cancelled")}return(b,r)=>{const _=n("v-card-text"),V=n("v-text-field"),f=n("v-col"),a=n("v-textarea"),P=n("v-card-title"),U=n("v-row"),A=n("v-card"),L=n("v-container"),M=n("v-form"),T=n("v-btn"),y=n("v-card-actions"),l=n("v-dialog");return G(),H(l,{modelValue:$.value,"onUpdate:modelValue":r[4]||(r[4]=u=>$.value=u),width:"auto"},{default:t(()=>[e(A,{title:"Edit Endorsement"},{default:t(()=>[e(_),e(M,{ref:"form","validate-on":"submit",density:"compact"},{default:t(()=>[e(L,null,{default:t(()=>[e(U,null,{default:t(()=>[e(f,{cols:"12"},{default:t(()=>[e(V,{modelValue:d.value.date,"onUpdate:modelValue":r[0]||(r[0]=u=>d.value.date=u),label:"Date",density:"compact","data-cy":"endorsement-date"},null,8,["modelValue"])]),_:1}),e(f,{cols:"12"},{default:t(()=>[e(a,{modelValue:d.value.by,"onUpdate:modelValue":r[1]||(r[1]=u=>d.value.by=u),label:"Endorser",rows:"2","auto-grow":"",density:"compact","data-cy":"endorsement-by"},null,8,["modelValue"])]),_:1}),e(f,{cols:"12"}),e(A,{class:"mb-5 bg-grey-lighten-4","min-width":"100%"},{default:t(()=>[e(P,{class:"text-caption text-grey-darken-1"},{default:t(()=>[R("Endorsement")]),_:1}),e(_,{width:"100%"},{default:t(()=>[e(U,null,{default:t(()=>[e(f,{cols:"12"},{default:t(()=>[e(N(ke),{modelValue:d.value.text,"onUpdate:modelValue":r[2]||(r[2]=u=>d.value.text=u),"api-key":"9niojaiuexw4ihh7nlsmoewnzlmwvs1u1s5szorzvugzv0s7",init:{...z},"data-cy":"endorsement-text"},null,8,["modelValue","init"])]),_:1})]),_:1})]),_:1})]),_:1}),e(f,{cols:"12"},{default:t(()=>[e(a,{modelValue:d.value.notes,"onUpdate:modelValue":r[3]||(r[3]=u=>d.value.notes=u),label:"Notes",rows:"2","auto-grow":"",density:"compact","data-cy":"notes"},null,8,["modelValue"])]),_:1})]),_:1})]),_:1})]),_:1},512),e(y,null,{default:t(()=>[e(T,{color:"primary","data-cy":"save-endorsement",onClick:I},{default:t(()=>[R("Save")]),_:1}),e(T,{"data-cy":"cancel-endorsement",onClick:B},{default:t(()=>[R("Cancel")]),_:1})]),_:1})]),_:1})]),_:1},8,["modelValue"])}}}),ze=J("span",{class:"text-h6"},"Endorsements",-1),Ue=Q({__name:"EndorsementsTable",setup(m){const{endorsements:k,findEndorsements:v,removeEndorsement:E,emptyEndorsement:C,saveEndorsement:d}=xe(),z=Z(),{notifyInfo:$}=te(),I=p(!1),B=p(""),b=W("endorsementsItemsPerPage",10),r=W("endorsementsSort",[{key:"endorsement_name",order:"asc"}]),_=p(!1),V=p(!1),f=p({}),a=p({}),P=[{title:"Date",key:"date"},{title:"By",key:"by"},{title:"Text",key:"text"},{title:"Actions",key:"actions",sortable:!1}];ee(async()=>{I.value=!0,await v({fk_book:Number(z.params.bookId)}),I.value=!1});const U=Y(()=>k.value),A=u=>{b.value=u},L=()=>{a.value=C(),_.value=!0},M=u=>{a.value=u,_.value=!0},T=u=>{_.value=!1,a.value=u,d(u),$("Endorsement saved")},y=u=>{f.value=u,V.value=!0},l=()=>{V.value=!1,E(f.value)};return(u,c)=>{const s=n("v-progress-circular"),D=n("v-btn"),i=n("v-tooltip"),h=n("v-col"),q=n("v-text-field"),S=n("v-row"),j=n("v-card-title"),F=n("router-link"),K=n("v-icon"),o=n("v-data-table"),le=n("v-card-text"),oe=n("v-card");return I.value?(G(),H(s,{key:0,indeterminate:"",color:"primary"})):(G(),H(oe,{key:1},{default:t(()=>[e(j,null,{default:t(()=>[e(S,{class:"mt-1"},{default:t(()=>[e(h,{cols:"4"},{default:t(()=>[ze,e(i,{text:"Add an endorsement"},{activator:t(({props:g})=>[e(D,ue({class:"ml-4"},g,{color:"info",icon:"mdi-plus",size:"x-small","data-cy":"add-item",onClick:L}),null,16)]),_:1})]),_:1}),e(h,{cols:"2",align:"right"}),e(h,{cols:"6",align:"right"},{default:t(()=>[e(q,{modelValue:B.value,"onUpdate:modelValue":c[0]||(c[0]=g=>B.value=g),"append-inner-icon":"mdi-magnify",label:"Search",density:"compact",clearable:"","single-line":"","data-cy":"search"},null,8,["modelValue"])]),_:1})]),_:1})]),_:1}),e(le,null,{default:t(()=>[e(o,{class:"elevation-1","sort-by":N(r),"onUpdate:sortBy":c[1]||(c[1]=g=>ie(r)?r.value=g:null),headers:P,items:U.value,"items-per-page":N(b),search:B.value,density:"compact","data-cy":"endorsements-table","onUpdate:itemsPerPage":A},{"item.endorsement_name":t(({item:g})=>[e(F,{to:{name:"endorsement-view",params:{endorsementId:g.id}}},{default:t(()=>[R(re(g.date),1)]),_:2},1032,["to"])]),"item.actions":t(({item:g})=>[e(K,{icon:"mdi-pencil",color:"primary",onClick:ne=>M(g)},null,8,["onClick"]),e(K,{class:"ml-2",icon:"mdi-minus-circle",color:"grey","data-cy":"remove-endorsement",onClick:ne=>y(g)},null,8,["onClick"])]),_:1},8,["sort-by","items","items-per-page","search"])]),_:1}),e(Ee,{show:_.value,endorsement:a.value,"data-cy":"endorsement-edit-dialog",onSave:T,onCancelled:c[2]||(c[2]=g=>_.value=!1)},null,8,["show","endorsement"]),e(we,{show:V.value,text:"Are you sure you want to remove this endorsement?",onConfirmed:l,onCancelled:c[3]||(c[3]=g=>V.value=!1)},null,8,["show"])]),_:1}))}}}),O=m=>(pe("data-v-2cd9280d"),m=m(),fe(),m),he=O(()=>J("span",{class:"text-h5"},"Amazon A+ Marketing",-1)),Ce=O(()=>J("span",{class:"text-h6"},"Module 1",-1)),Ie=O(()=>J("span",{class:"text-h6"},"Module 2",-1)),Be=O(()=>J("span",{class:"text-h6"},"Module 3",-1)),De=Q({__name:"BookMarketingView",setup(m){const k=Z(),v=me(),{notifyInfo:E,notifyError:C}=te(),{uriRule:d}=ge(),{baseEditorInit:z}=ae(),{getBook:$,emptyBook:I,saveBook:B}=Ve(),b=p(void 0),r=p(!0),_=p(!1),V=p(""),f=p(!1),a=p(I()),P=p(null),U={...z,setup:function(y){y.on("copy",function(l){var u;(u=l.clipboardData)==null||u.setData("text/plain",y.selection.getContent()),l.preventDefault()})}};ee(async()=>{r.value=!0;const y=Number(k.params.bookId);a.value=await $(y),P.value=X.cloneDeep(a.value),r.value=!1,_.value=!1,V.value=""}),ce(y=>!_.value&&!X.isEqual(a.value,P.value)?(V.value=y.name,f.value=!0,!1):!0);function A(){f.value=!1,M(),v.push({name:V.value||"books-view"})}function L(){f.value=!1,_.value=!0,ve().then(()=>{v.push({name:V.value||"books-view"})})}async function M(){var l;const y=await b.value.validate();y.valid?(await B(a.value),_.value=!0,v.push({name:V.value||"books-view"}),E(`Book ${(l=a.value)==null?void 0:l.title} saved`)):(document.querySelector(`#${y.errors[0].id}`).focus(),C("Check the form for errors and try saving again"))}function T(){_.value=!0,v.push({name:"books-view"})}return(y,l)=>{const u=n("v-progress-linear"),c=n("v-text-field"),s=n("v-col"),D=n("v-btn"),i=n("v-row"),h=n("v-card-title"),q=n("Editor"),S=n("v-card-text"),j=n("v-card"),F=n("v-switch"),K=n("v-form");return r.value?(G(),H(u,{key:0,indeterminate:"",color:"primary"})):(G(),H(j,{key:1,title:"Add / Edit Marketing"},{default:t(()=>[e(S,null,{default:t(()=>[e(K,{ref_key:"form",ref:b,"validate-on":"submit",density:"compact",onSubmit:_e(M,["prevent"])},{default:t(()=>[e(i,null,{default:t(()=>[e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.goodreads_reviews_link,"onUpdate:modelValue":l[0]||(l[0]=o=>a.value.goodreads_reviews_link=o),label:"Goodreads Reviews Link",rules:[N(d)],density:"compact","data-cy":"goodreads-reviews-link"},null,8,["modelValue","rules"])]),_:1}),e(s,{cols:"1"},{default:t(()=>[e(D,{href:a.value.goodreads_reviews_link,target:"_blank",rel:"noopener noreferrer",icon:"mdi-open-in-new","data-cy":"open-goodreads-link"},null,8,["href"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.amazon_sales_page_link,"onUpdate:modelValue":l[1]||(l[1]=o=>a.value.amazon_sales_page_link=o),label:"Amazon Sales Page Link",rules:[N(d)],density:"compact","data-cy":"amazon-reviews-link"},null,8,["modelValue","rules"])]),_:1}),e(s,{cols:"1"},{default:t(()=>[e(D,{href:a.value.amazon_sales_page_link,target:"_blank",rel:"noopener noreferrer",icon:"mdi-open-in-new"},null,8,["href"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.amazon_a_plus_link,"onUpdate:modelValue":l[2]||(l[2]=o=>a.value.amazon_a_plus_link=o),label:"Amazon A+ Link",rules:[N(d)],density:"compact","data-cy":"amazon-a1-link"},null,8,["modelValue","rules"])]),_:1}),e(s,{cols:"1"},{default:t(()=>[e(D,{href:a.value.amazon_a_plus_link,target:"_blank",rel:"noopener noreferrer",icon:"mdi-open-in-new"},null,8,["href"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(Ue,{density:"compact","data-cy":"endorsements-table"})]),_:1})]),_:1}),e(j,null,{default:t(()=>[e(h,null,{default:t(()=>[he]),_:1}),e(S,null,{default:t(()=>[e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[Ce]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_description_1,"onUpdate:modelValue":l[3]||(l[3]=o=>a.value.a_plus_description_1=o),label:"Description",dense:"compact","data-cy":"a1-description-1"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(j,{class:"mb-5 bg-grey-lighten-4","min-width":"100%"},{default:t(()=>[e(h,{class:"text-caption text-grey-darken-1"},{default:t(()=>[R("Body Text")]),_:1}),e(S,{width:"100%"},{default:t(()=>[e(q,{modelValue:a.value.a_plus_text_1,"onUpdate:modelValue":l[4]||(l[4]=o=>a.value.a_plus_text_1=o),"api-key":"9niojaiuexw4ihh7nlsmoewnzlmwvs1u1s5szorzvugzv0s7",init:{...U},"data-cy":"a1-text-1"},null,8,["modelValue","init"])]),_:1})]),_:1})]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_image_1,"onUpdate:modelValue":l[5]||(l[5]=o=>a.value.a_plus_image_1=o),label:"Image file",dense:"compact","data-cy":"a1-image-1"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"1"},{default:t(()=>[e(F,{modelValue:a.value.a_plus_is_live_1,"onUpdate:modelValue":l[6]||(l[6]=o=>a.value.a_plus_is_live_1=o),label:"Is live",color:"primary",dense:"compact","data-cy":"a1-is-live-1"},null,8,["modelValue"])]),_:1}),e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_rejection_reason_1,"onUpdate:modelValue":l[7]||(l[7]=o=>a.value.a_plus_rejection_reason_1=o),label:"Reason for rejection",dense:"compact","data-cy":"a1-rejection-reason-1"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[Ie]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_description_2,"onUpdate:modelValue":l[8]||(l[8]=o=>a.value.a_plus_description_2=o),label:"Description",dense:"compact","data-cy":"a1-description-2"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(j,{class:"mb-5 bg-grey-lighten-4","min-width":"100%"},{default:t(()=>[e(h,{class:"text-caption text-grey-darken-1"},{default:t(()=>[R("Body Text")]),_:1}),e(S,{width:"100%"},{default:t(()=>[e(q,{modelValue:a.value.a_plus_text_2,"onUpdate:modelValue":l[9]||(l[9]=o=>a.value.a_plus_text_2=o),"api-key":"9niojaiuexw4ihh7nlsmoewnzlmwvs1u1s5szorzvugzv0s7",init:{...U},"data-cy":"a1-text-2"},null,8,["modelValue","init"])]),_:1})]),_:1})]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_image_2,"onUpdate:modelValue":l[10]||(l[10]=o=>a.value.a_plus_image_2=o),label:"Image file",dense:"compact","data-cy":"a1-image-2"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"1"},{default:t(()=>[e(F,{modelValue:a.value.a_plus_is_live_2,"onUpdate:modelValue":l[11]||(l[11]=o=>a.value.a_plus_is_live_2=o),label:"Is live",color:"primary",dense:"compact","data-cy":"a1-is-live-2"},null,8,["modelValue"])]),_:1}),e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_rejection_reason_2,"onUpdate:modelValue":l[12]||(l[12]=o=>a.value.a_plus_rejection_reason_2=o),label:"Reason for rejection",dense:"compact","data-cy":"a1-rejection-reason-2"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[Be]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_description_3,"onUpdate:modelValue":l[13]||(l[13]=o=>a.value.a_plus_description_3=o),label:"Description",dense:"compact","data-cy":"a1-description-3"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(j,{class:"mb-5 bg-grey-lighten-4","min-width":"100%"},{default:t(()=>[e(h,{class:"text-caption text-grey-darken-1"},{default:t(()=>[R("Body Text")]),_:1}),e(S,{width:"100%"},{default:t(()=>[e(q,{modelValue:a.value.a_plus_text_3,"onUpdate:modelValue":l[14]||(l[14]=o=>a.value.a_plus_text_3=o),"api-key":"9niojaiuexw4ihh7nlsmoewnzlmwvs1u1s5szorzvugzv0s7",init:{...U},"data-cy":"a1-text-3"},null,8,["modelValue","init"])]),_:1})]),_:1})]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_image_3,"onUpdate:modelValue":l[15]||(l[15]=o=>a.value.a_plus_image_3=o),label:"Image file",dense:"compact","data-cy":"a1-image-3"},null,8,["modelValue"])]),_:1})]),_:1}),e(i,null,{default:t(()=>[e(s,{cols:"1"},{default:t(()=>[e(F,{modelValue:a.value.a_plus_is_live_3,"onUpdate:modelValue":l[16]||(l[16]=o=>a.value.a_plus_is_live_3=o),label:"Is live",color:"primary",dense:"compact","data-cy":"a1-is-live-3"},null,8,["modelValue"])]),_:1}),e(s,{cols:"11"},{default:t(()=>[e(c,{modelValue:a.value.a_plus_rejection_reason_3,"onUpdate:modelValue":l[17]||(l[17]=o=>a.value.a_plus_rejection_reason_3=o),label:"Reason for rejection",dense:"compact","data-cy":"a1-rejection-reason-3"},null,8,["modelValue"])]),_:1})]),_:1})]),_:1})]),_:1}),e(i,{class:"mt-4"},{default:t(()=>[e(s,{cols:"12"},{default:t(()=>[e(D,{type:"submit",text:"Save",color:"primary",size:"small","data-cy":"save-book"}),e(D,{class:"ml-4",text:"Cancel",size:"small","data-cy":"cancel-book",onClick:T})]),_:1})]),_:1})]),_:1},512),e(ye,{show:f.value,"item-name":"book",onSave:A,onDontSave:L,onCancelled:l[18]||(l[18]=o=>f.value=!1)},null,8,["show"])]),_:1})]),_:1}))}}}),Ne=be(De,[["__scopeId","data-v-2cd9280d"]]);export{Ne as default};
