define(
		[ 'renderer/ShaderCall' ],
		function(ShaderCall) {
			function Shader(name, vertexSource, fragmentSource) {
				this.name = name;
				this.vertexSource = vertexSource;
				this.fragmentSource = fragmentSource;

				this.shaderProgram = null;

				this.attributeMapping = {};
				this.attributeIndexMapping = {};

				this.uniformMapping = {};
				this.uniformCallMapping = {};
				this.uniformLocationMapping = {};

				this.patternStr = '\\b(attribute|uniform)\\s+(vec2|vec3|vec4|mat3|mat4|sampler2D|sampler3D|samplerCube)\\s+(\\w+);(?:\\s*//\\s*!\\s*(\\w+))*';
				this.regExp = new RegExp(this.patternStr, 'g');
				this.textureCount = 0;
			}

			Shader.prototype.apply = function(shaderInfoRetriever, renderer) {
				var glContext = renderer.context;
				var record = renderer.shaderRecord;

				if (this.shaderProgram == null) {
					this.investigateShaders();
					this.compile(renderer);
				}

				// Set the ShaderProgram active
				if (record.usedProgram != this.shaderProgram) {
					glContext.useProgram(this.shaderProgram);
					record.usedProgram = this.shaderProgram;
				}

				// Bind attributes
				var descriptors = shaderInfoRetriever.meshData._dataMap.descriptors;
				for (key in descriptors) {
					var descriptor = descriptors[key];
					var i = this.attributeMapping[descriptor.attributeName];
					if (i != undefined) {
						renderer.bindVertexAttribute(i, descriptor.count, descriptor.type, descriptor.normalized,
								descriptor.stride * this.getBytes(descriptor.type), descriptor.offset, record);
					}
				}

				// for (final Entry<String, ShaderCallback> entry :
				// getCallbacks().entrySet()) {
				// entry.getValue().setUniforms(uniformCallMapping,
				// shaderInfoRetriever);
				// }

				// record.valid = true;
			};

			Shader.prototype.investigateShaders = function() {
				this.textureCount = 0;
				this.investigateShader(this.vertexSource);
				this.investigateShader(this.fragmentSource);
			};

			Shader.prototype.investigateShader = function(source) {
				// TODO: do regexp
				this.regExp.lastIndex = 0;
				var matcher = this.regExp.exec(source);

				while (matcher != null) {
					var type = matcher[1];
					var format = matcher[2];
					var variableName = matcher[3];
					var bindingName = matcher[4];

					if (bindingName == undefined) {
						bindingName = variableName;
					}

					if ("attribute" === type) {
						this.attributeMapping[bindingName] = variableName;
						// bindAttribute(bindingName, variableName);
					} else {
						if (format.indexOf("sampler") == 0) {
							this.textureCount++;
						}
						this.uniformMapping[bindingName] = variableName;
						// bindUniform(bindingName, variableName);
					}

					// if (Shader.defaultCallbacks.containsKey(bindingName)) {
					// currentCallbacks.put(bindingName,
					// Shader.defaultCallbacks.get(bindingName));
					// }

					matcher = this.regExp.exec(source);
				}
			};

			Shader.prototype.compile = function(renderer) {
				var glContext = renderer.context;
				var record = renderer.shaderRecord;

				var vertexShader = this._getShader(glContext, glContext.VERTEX_SHADER, this.vertexSource);
				console.log("Created vertex shader");

				var fragmentShader = this._getShader(glContext, glContext.FRAGMENT_SHADER, this.fragmentSource);
				console.log("Created fragment shader");

				if (vertexShader == null || fragmentShader == null) {
					console.error("Shader error - no shaders");
					// throw new RuntimeException("shader error");
				}

				this.shaderProgram = glContext.createProgram();
				var error = glContext.getError();
				if (this.shaderProgram == null || error != glContext.NO_ERROR) {
					console.error("Program errror: " + error + "[shader: " + name + "]");
					// throw new RuntimeException("program error");
				}

				console.log("Shader program created");
				glContext.attachShader(this.shaderProgram, vertexShader);
				console.log("vertex shader attached to shader program");
				glContext.attachShader(this.shaderProgram, fragmentShader);
				console.log("fragment shader attached to shader program");

				// Link the Shader Program
				glContext.linkProgram(this.shaderProgram);
				if (!glContext.getProgramParameter(this.shaderProgram, glContext.LINK_STATUS)) {
					console.error("Could not initialise shaders: " + glContext.getProgramInfoLog(shaderProgram));
					// throw new RuntimeException("Could not initialise shaders:
					// " +
					// glContext.getProgramInfoLog(shaderProgram));
				}
				console.log("Shader program linked");

				for (key in this.attributeMapping) {
					var attributeIndex = glContext.getAttribLocation(this.shaderProgram, this.attributeMapping[key]);
					this.attributeIndexMapping[key] = attributeIndex;
				}

				for (key in this.uniformMapping) {
					var uniform = glContext.getUniformLocation(this.shaderProgram, this.uniformMapping[key]);
					console.log(uniform);
					this.uniformLocationMapping[key] = uniform;

					var shaderCall = new ShaderCall(glContext);

					var uniformRecord = record.uniformRecords.get(this.shaderProgram);
					if (uniformRecord == null) {
						uniformRecord = {
							boundValues : new Hashtable()
						};
						record.uniformRecords.put(this.shaderProgram, uniformRecord);
					}
					var uniformRecord = {};
					uniformRecord.boundValues = new Hashtable();

					shaderCall.currentRecord = uniformRecord;
					shaderCall.location = uniform;
					this.uniformCallMapping[key] = shaderCall;
				}

			};

			Shader.prototype._getShader = function(glContext, type, source) {
				var shader = glContext.createShader(type);

				glContext.shaderSource(shader, source);
				glContext.compileShader(shader);

				// check if the Shader is successfully compiled
				if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
					console.error(glContext.getShaderInfoLog(shader));
					// console.error( addLineNumbers( string ) );
					return null;
				}

				return shader;
			};

			// Byte(1), UnsignedByte(1), Short(2), UnsignedShort(2), Int(4),
			// UnsignedInt(4),
			// HalfFloat(2), Float(4), Double(8);

			Shader.prototype.getBytes = function(type) {
				switch (type) {
					case 'Byte':
						return 1;
						break;
					case 'UnsignedByte':
						return 1;
						break;
					case 'Short':
						return 2;
						break;
					case 'UnsignedShort':
						return 2;
						break;
					case 'Int':
						return 4;
						break;
					case 'HalfFloat':
						return 2;
						break;
					case 'Float':
						return 4;
						break;
					case 'Double':
						return 8;
						break;
				}
			};

			return Shader;
		});