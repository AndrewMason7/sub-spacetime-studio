this.assoStatus="loading",t.load("/models/associahedron.glb?v=v8",i=>{if(this.disposed){Ye(i.scene);return}const s=i.scene,n={4:6220500,5:9684477,6:14202110},a=new Map,r=/^AssoN[456](_Proj\d\d)?(_Cage)?$/;s.traverse(g=>{if(!g.isMesh)return;const p=g;if(!r.test(p.name))return;const T=p.name.startsWith("AssoN6")?6:p.name.startsWith("AssoN5")?5:4,S=n[T],l=p.name.includes("_Cage"),y={uAssoSweepPhase:{value:0}},x=new we({color:l?9741240:S,emissive:l?988970:S,emissiveIntensity:l?.05:.12,metalness:.14,roughness:.22,clearcoat:.92,clearcoatRoughness:.16,iridescence:.58,iridescenceIOR:1.38,sheen:.62,sheenRoughness:.24,sheenColor:new ee(10090212),flatShading:!0,transparent:!1,depthWrite:!0,side:qt});if(l||(x.onBeforeCompile=E=>{E.uniforms.uAssoSweepPhase=y.uAssoSweepPhase,E.vertexShader=E.vertexShader.replace("#include <common>",`#include <common>
                varying vec3 vAssoViewOffset;`),E.vertexShader=E.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
                vec3 assoWorldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                vec3 assoWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vAssoViewOffset = mat3(viewMatrix) * (assoWorldPos - assoWorldCenter);`),E.fragmentShader=E.fragmentShader.replace("#include <common>",`#include <common>
                uniform float uAssoSweepPhase;
                varying vec3 vAssoViewOffset;`),E.fragmentShader=E.fragmentShader.replace("#include <opaque_fragment>",`// Exact intra-facet tangent coordinates: for a flat facet with unit normal N,
                // dot(vAssoViewOffset, normal) is the constant support distance of that facet plane,
                // so facetTangent is the 2D coordinate vector within the facet plane from its pedal center.
                vec3 viewDir = normalize(vViewPosition);
                vec3 facetTangent = vAssoViewOffset - normal * dot(vAssoViewOffset, normal);
                float facetRadial = length(facetTangent);
                // Optical dispersion normal: discontinuous across crease edges, sweeps ~38 deg within each facet
                vec3 optNormal = normalize(normal + 0.68 * facetTangent);

                float ndotvFlat = clamp(dot(normal, viewDir), 0.0, 1.0);
                float ndotvOpt = clamp(dot(optNormal, viewDir), 0.0, 1.0);
                // Selectively target oblique side & lower facets while preserving bright top cap
                float sideMask = smoothstep(0.52, -0.05, normal.y);
                // Attenuate base diffuse/emissive in the interior of side facets to carve jewel depth
                float interiorCarve = mix(1.0, 0.68 + 0.32 * smoothstep(0.25, 1.05, facetRadial), sideMask);
                outgoingLight *= interiorCarve;

                // 1. Grazing-angle Schlick Fresnel response along outer/lower facet perimeters
                float fresnelRim = pow(1.0 - ndotvOpt, 2.25) * smoothstep(0.18, 0.95, facetRadial);
                float lowerRightWeight = 0.65 + 0.55 * smoothstep(-0.4, 0.9, vAssoViewOffset.x - 0.65 * vAssoViewOffset.y);

                // 2. Crisp travelling studio specular reflection across side & lower facets
                vec3 reflDir = reflect(-viewDir, optNormal);
                float phase = uAssoSweepPhase;
                // Primary grazing studio strip positioned to rake across the rightmost quadrilateral facet
                vec3 rightStudioDir = normalize(vec3(
                  0.64 + 0.16 * sin(phase * 0.65 - 0.8),
                  -0.22 + 0.14 * cos(phase * 0.50),
                  0.70
                ));
                // Secondary lower-edge studio strip catching the lower bevels and front-left facet
                vec3 lowerStudioDir = normalize(vec3(
                  -0.28 + 0.20 * cos(phase * 0.55),
                  -0.58 + 0.14 * sin(phase * 0.45),
                  0.76
                ));
                float specRight = pow(max(0.0, dot(reflDir, rightStudioDir)), 22.0);
                float specLower = pow(max(0.0, dot(reflDir, lowerStudioDir)), 18.0);

                vec3 iceSpecColor = vec3(0.84, 0.99, 0.97);
                vec3 grazingTealColor = mix(vec3(0.37, 0.92, 0.83), vec3(0.58, 0.77, 0.99), smoothstep(0.0, -1.2, vAssoViewOffset.y));
                vec3 violetRimColor = vec3(0.76, 0.54, 0.99);

                outgoingLight += sideMask * (
                  0.18 * fresnelRim * lowerRightWeight * grazingTealColor +
                  0.26 * specRight * iceSpecColor +
                  0.16 * specLower * mix(grazingTealColor, violetRimColor, 0.42)
                );

                // Strict sub-bloom soft-knee ceiling: engine BloomEffect thresholds at 0.42 linear luminance.
                // Soft-knee compression above 0.25 with asymptote 0.385 keeps every facet < 0.385 < 0.42.
                float outLum = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
                if (outLum > 0.25) {
                  float compressedLum = 0.25 + 0.135 * tanh((outLum - 0.25) / 0.135);
                  outgoingLight *= compressedLum / max(outLum, 1e-4);
                }
                #include <opaque_fragment>`)}),p.material=x,p.visible=!1,l)return;let N;const R=T===4?s.getObjectByName("AssoN4_Cage"):null;T===4&&R&&R.geometry?N=new dt(R.geometry,1):N=new dt(p.geometry,os);const w=new De(N,new $t({color:S,transparent:!0,opacity:.75,depthWrite:!1,toneMapped:!1}));w.name=`${p.name}_Wire`,p.add(w);let M=null;const v=T===4&&R&&R.geometry?ht(R.geometry):ht(p.geometry),A=v.length/3;if(A>0){M=new Qt(new Yt(.048,0),new Zt({color:S,toneMapped:!1}),A),M.name=`${p.name}_Nodes`;const E=new Xt;for(let d=0;d<A;d++)E.makeTranslation(v[d*3],v[d*3+1],v[d*3+2]),M.setMatrixAt(d,E);M.instanceMatrix.needsUpdate=!0,p.add(M)}const _=a.get(T)??[];_.push({mesh:p,material:p.material,wireMaterial:w.material,nodes:M,shaderUniforms:y}),a.set(T,_)});for(const g of a.values())g.sort((p,T)=>p.mesh.name.localeCompare(T.mesh.name));for(const g of Xo){const p=Ue[g].frames.map(x=>x.mesh),T=(a.get(g)??[]).map(x=>x.mesh.name);if(p.length!==T.length||p.some((x,N)=>x!==T[N])){console.warn("[ManifoldGlbArticulator] MOD-05 GLB/sidecar frame mismatch; module disabled",{order:g,expected:p.length,got:T.length}),window.__assoMismatch={expected:p,got:T},console.error("[MOD-05] frame/sidecar mismatch",{expected:p,got:T}),this.assoStatus="failed",Ye(s);return}const S=a.get(g)??[];let l=0;for(const x of S){x.mesh.geometry.computeBoundingSphere();const N=x.mesh.geometry.boundingSphere;N&&(l=Math.max(l,N.radius))}const y=l>0?ts/l:1;for(const x of S)x.mesh.scale.setScalar(y)}const c=new xe;c.name="AssociahedronLightRig",c.rotation.order="YXZ";const m=new _e(13433841,12,28,2);m.position.set(3.6,4.4,5.6);const C=new _e(12616956,8.5,28,2);C.position.set(-4.6,-2.4,-3.8);const b=new _e(6809849,7.5,24,2);b.position.set(5.6,-2.4,2.4),c.add(m,C,b),s.add(c),this.assoLightRig=c,this.assoGrazingLight=b,