/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
        this.ambientloc = gl.getUniformLocation(this.prog, 'ambientpower');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
        this.normalbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
        this.enableLightingloc = gl.getUniformLocation(this.prog,'enableLighting');
        this.ambinetpower = 0.3;
		
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;


        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
        

	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.ambientloc, this.ambinetpower);
        gl.uniform1i(this.enableLightingloc, this.Lightenabled );
		/**
		 * @Task2 : You should update this function to handle the lighting
		 */
        
        gl.uniform3f(
            gl.getUniformLocation(this.prog, "lightPos"),
            lightX,
            lightY,
            5.0 // Assuming light position in Z-axis
        );
        //gl.uniform1i(this.ambientloc,this.ambinetpower);

		///////////////////////////////

		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
        


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //task1
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
        this.Lightenabled = show;

	}
	
	setAmbientLight(ambient) {
        this.ambinetpower = ambient;
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 
            varying vec3 vertPos;

			void main()
			{
                vec4 vertPos4 = mvp * vec4(pos, 1.0);
                vertPos = vec3(vertPos4) / vertPos4.w;
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex;
			uniform vec3 color; 
			uniform vec3 lightPos;
            uniform float ambientpower;



			varying vec2 v_texCoord;
			varying vec3 v_normal;
            varying vec3 vertPos;

			void main()
			{
				if(showTex && enableLighting){
					vec3 N = normalize(v_normal);
                    vec3 L = normalize(lightPos - vertPos);

                    // Lambert's cosine law //this did not work.
                    float lambertian = max(dot(N, L), 0.0);
                    float specular = 0.0;
                    if(lambertian > 0.0) {
                    vec3 R = reflect(-L, N);      // Reflected light vector
                    vec3 V = normalize(-vertPos); // Vector to viewer
                    // Compute the specular term
                    float specAngle = max(dot(R, V), 0.0);
                    specular = pow(specAngle, 23.0);
                    }
                    vec4 texColor = texture2D(tex, v_texCoord);
                    vec3 lighting = ambientpower*vec3(0.8, 0.8, 0.8) + lambertian * vec3(0.7, 0.7, 0.7) + specular * vec3(1.0, 1.0, 1.0);
                    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
                		
				    }
				else if(showTex){
					gl_FragColor = texture2D(tex, v_texCoord);
				}
				else{
					gl_FragColor =  vec4(1.0, 0, 0, 1.0);
				}
			}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY += translationSpeed;
	if (keys['ArrowDown']) lightY -= translationSpeed;
	if (keys['ArrowRight']) lightX += translationSpeed;
	if (keys['ArrowLeft']) lightX -= translationSpeed;
}


function calculateNormalMatrix(modelMatrix) {
    // Extract the upper-left 3x3 part of the model matrix
    const normalMatrix = [
        modelMatrix[0], modelMatrix[1], modelMatrix[2],
        modelMatrix[4], modelMatrix[5], modelMatrix[6],
        modelMatrix[8], modelMatrix[9], modelMatrix[10],
    ];

    // Compute the determinant of the 3x3 matrix
    const det = 
        normalMatrix[0] * (normalMatrix[4] * normalMatrix[8] - normalMatrix[5] * normalMatrix[7]) -
        normalMatrix[1] * (normalMatrix[3] * normalMatrix[8] - normalMatrix[5] * normalMatrix[6]) +
        normalMatrix[2] * (normalMatrix[3] * normalMatrix[7] - normalMatrix[4] * normalMatrix[6]);

    if (Math.abs(det) < 1e-6) {
        console.error("Matrix is singular, cannot compute normal matrix.");
        return null;
    }

    const invDet = 1.0 / det;

    // Compute the inverse of the 3x3 matrix
    const invNormalMatrix = [
        (normalMatrix[4] * normalMatrix[8] - normalMatrix[5] * normalMatrix[7]) * invDet,
        (normalMatrix[2] * normalMatrix[7] - normalMatrix[1] * normalMatrix[8]) * invDet,
        (normalMatrix[1] * normalMatrix[5] - normalMatrix[2] * normalMatrix[4]) * invDet,

        (normalMatrix[5] * normalMatrix[6] - normalMatrix[3] * normalMatrix[8]) * invDet,
        (normalMatrix[0] * normalMatrix[8] - normalMatrix[2] * normalMatrix[6]) * invDet,
        (normalMatrix[2] * normalMatrix[3] - normalMatrix[0] * normalMatrix[5]) * invDet,

        (normalMatrix[3] * normalMatrix[7] - normalMatrix[4] * normalMatrix[6]) * invDet,
        (normalMatrix[1] * normalMatrix[6] - normalMatrix[0] * normalMatrix[7]) * invDet,
        (normalMatrix[0] * normalMatrix[4] - normalMatrix[1] * normalMatrix[3]) * invDet,
    ];

    // Return the transpose of the inverse (normal matrix)
    return [
        invNormalMatrix[0], invNormalMatrix[3], invNormalMatrix[6],
        invNormalMatrix[1], invNormalMatrix[4], invNormalMatrix[7],
        invNormalMatrix[2], invNormalMatrix[5], invNormalMatrix[8],
    ]
}   
///////////////////////////////////////////////////////////////////////////////////