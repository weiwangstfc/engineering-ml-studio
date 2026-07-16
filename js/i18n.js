(function (global) {
  'use strict';

  const translations = {
    'zh-CN': {
      'Language':'语言','Interface language':'界面语言','Automatic (browser)':'自动（浏览器）',
      'JavaScript is required to run this application.':'运行此应用需要启用 JavaScript。',
      'Governed browser-only machine learning · v1.0.11':'仅浏览器端机器学习 · v1.0.11',
      'Prepare CSV data, train regression models, evaluate independent validation and test sets, diagnose errors and uncertainty, then predict unknown data without uploading it.':'准备 CSV 数据、训练回归模型、评估独立的验证集和测试集、诊断误差与不确定性，并在不上传数据的情况下预测新数据。',
      'Loading libraries…':'正在加载程序库…','Privacy':'隐私','Load data':'加载数据','Features':'特征','Preprocess':'预处理','Model':'模型','Split & train':'划分与训练','Diagnostics':'诊断','Predict':'预测',
      'Local by design':'本地化设计','CSV contents, models and results stay on this device unless you explicitly save or download a file.':'除非您主动保存或下载文件，否则 CSV 内容、模型和结果都保留在此设备上。',
      'Start and load data':'开始并加载数据','Drop a CSV here or choose a file':'将 CSV 拖到此处或选择文件','Recommended: up to 50,000 rows and 50 original columns':'建议：最多 50,000 行和 50 个原始列','Choose CSV':'选择 CSV','Open project':'打开项目','Load fitted model':'加载已拟合模型','Use offline mode — local libraries only':'使用离线模式——仅使用本地程序库','Offline mode reloads the app without attempting any CDN request. In either mode, CSV data is never sent to a CDN.':'离线模式会重新加载应用且不尝试任何 CDN 请求。无论哪种模式，CSV 数据都不会发送到 CDN。',
      'Select features and transform the target':'选择特征并转换目标变量','Detect features automatically':'自动检测特征','Target column':'目标列','Choose target…':'选择目标…','Target transformation':'目标变换','None':'无','Natural logarithm':'自然对数','Log base 10':'以 10 为底的对数','Square root':'平方根','Feature search':'搜索特征','Predictions and uncertainty bounds are converted back to the original target scale.':'预测值和不确定性边界会转换回目标变量的原始尺度。','Select all eligible':'选择所有可用项','Clear selection':'清除选择',
      'Configure preprocessing':'配置预处理','Numeric missing values':'数值缺失值','Replace with mean':'用均值替换','Replace with median':'用中位数替换','Replace with zero':'用零替换','Drop affected rows':'删除受影响的行','Numeric scaling fitted on training data':'基于训练数据拟合的数值缩放','Standardise':'标准化','Min–max scale':'最小-最大缩放','No scaling':'不缩放','Scaling parameters are calculated from the training dataset only. The same fitted scaling is applied unchanged to validation, test and unknown prediction data.':'缩放参数仅从训练数据计算。同一组已拟合的缩放参数将不变地应用于验证、测试和新预测数据。','Categorical missing values':'类别缺失值','Use “Missing” category':'使用“缺失”类别','Replace with most frequent':'用最常见类别替换','Categorical encoding':'类别编码','One-hot encoding':'独热编码','Ordinal integer encoding':'序数整数编码','Exclude categorical columns':'排除类别列','Maximum categories per column':'每列最大类别数','Remove one reference category from each categorical feature':'从每个类别特征中移除一个参考类别','Recommended for linear and ridge regression to avoid redundant one-hot columns. Usually unnecessary for tree models.':'建议在线性和岭回归中使用，以避免冗余的独热列。树模型通常不需要。','Select a target and at least one feature to estimate the processed feature count.':'请选择目标变量和至少一个特征，以估算处理后的特征数量。',
      'Select a model and tune hyperparameters':'选择模型并调节超参数','Linear regression':'线性回归','Fast, interpretable baseline with analytical prediction intervals.':'快速、可解释的基线模型，并提供解析预测区间。','Ridge regression':'岭回归','Coefficient shrinkage with bootstrap uncertainty.':'使用系数收缩和自助法不确定性。','Decision tree':'决策树','Nonlinear model with approximate leaf-based intervals.':'非线性模型，提供近似叶节点区间。','Random forest':'随机森林','Tree ensemble with approximate between-tree intervals.':'树集成模型，提供近似树间区间。','Gaussian process':'高斯过程','Planned advanced module.':'计划中的高级模块。','Artificial neural network':'人工神经网络','Tuning method':'调参方法','Manual configuration':'手动配置','Grid search':'网格搜索','Ordinary random search':'普通随机搜索','Latin hypercube sampling':'拉丁超立方抽样','Number of search samples':'搜索样本数','Manual configuration selected.':'已选择手动配置。','Grid values are generated from minimum, maximum and number of points. Tuning compares candidates on the validation set only; the test set remains isolated.':'网格值由最小值、最大值和点数生成。调参只在验证集上比较候选方案；测试集保持独立。',
      'Split data and train the model':'划分数据并训练模型','Split strategy':'划分策略','Naive random split':'简单随机划分','Metadata/source-grouped split':'按元数据/来源分组划分','Regime-aware split':'工况感知划分','Time-based split for transient data':'瞬态数据的时间划分','Random seed':'随机种子','Run k-fold cross-validation on training data':'在训练数据上运行 K 折交叉验证','Fits preprocessing and the model separately in each fold.':'每一折都会分别拟合预处理和模型。','Number of folds':'折数','Prediction uncertainty':'预测不确定性','Estimate prediction intervals':'估计预测区间','The method depends on the selected model and is labelled in results.':'所用方法取决于所选模型，并会在结果中标明。','Requested interval coverage':'要求的区间覆盖率','Bootstrap models for ridge':'岭回归的自助模型数','Choose a split strategy. A split summary will be shown before training.':'请选择划分策略。训练前将显示划分摘要。','Training data fits preprocessing and the model. Validation data selects hyperparameters. Test data is used only for the final independent evaluation.':'训练数据用于拟合预处理和模型；验证数据用于选择超参数；测试数据仅用于最终独立评估。','Preview split':'预览划分','Train and evaluate':'训练并评估','Cancel':'取消',
      'Evaluate and diagnose the model':'评估并诊断模型','Diagnostic plot settings':'诊断图设置','Dataset shown in plots':'图中显示的数据集','Test':'测试','Validation':'验证','Training':'训练','Input feature for residual plot':'残差图的输入特征','Source column for grouped diagnostics':'分组诊断的来源列','No source grouping':'不按来源分组','Show uncertainty intervals in plots':'在图中显示不确定性区间','This controls only the displayed uncertainty bands and error bars. It does not change the fitted model or uncertainty metrics.':'此选项只控制图中显示的不确定性带和误差棒，不会改变已拟合模型或不确定性指标。','Actual vs predicted':'实际值与预测值','Residuals vs predicted':'残差与预测值','Residual distribution':'残差分布','Residual Q–Q plot':'残差 Q–Q 图','Residuals vs input feature':'残差与输入特征','Residuals by source':'按来源显示残差','Interval width vs prediction':'区间宽度与预测值','Feature importance':'特征重要性','Export results':'导出结果','Download model':'下载模型','Download split predictions':'下载各数据集预测','Download metrics':'下载指标','Save project':'保存项目','Download all plots':'下载所有图','The project file does not contain the original CSV.':'项目文件不包含原始 CSV。','It contains configuration, fitted model, predictions and diagnostic results.':'其中包含配置、已拟合模型、预测和诊断结果。',
      'Predict unknown data':'预测新数据','Upload prediction CSV':'上传预测 CSV','Plot predictions against input feature':'按输入特征绘制预测','Optional source/group column':'可选来源/分组列','No grouping':'不分组','Download predicted values':'下载预测值','Optional measured-target comparison':'可选实测目标对比','Show measured target values in the plot':'在图中显示实测目标值','Measured values are displayed only for comparison. They are not used to fit, update or tune the model.':'实测值仅用于比较，不会用于拟合、更新或调节模型。','Measured target column':'实测目标列','Choose measured target…':'选择实测目标…','Train or load a fitted model, then upload a compatible CSV. A measured target column is optional.':'请先训练或加载已拟合模型，然后上传兼容的 CSV。实测目标列为可选项。','Predictions against selected input feature':'预测值与所选输入特征',
      'Privacy and network behaviour':'隐私与网络行为','CSV data, preprocessing, training, diagnostics and predictions run in this browser. The app has no analytics, cloud-storage or data-upload endpoint.':'CSV 数据、预处理、训练、诊断和预测均在此浏览器中运行。本应用不包含分析、云存储或数据上传端点。','Hybrid mode may request public JavaScript libraries from a CDN. Those startup requests do not include CSV data. Offline mode uses only bundled local libraries and makes no CDN attempt.':'混合模式可能从 CDN 请求公共 JavaScript 程序库。这些启动请求不包含 CSV 数据。离线模式只使用随附的本地程序库，不会尝试连接 CDN。','Downloaded projects, models and prediction files may contain sensitive derived information. Store and share them appropriately.':'下载的项目、模型和预测文件可能包含敏感的衍生信息，请妥善存储和共享。','Close':'关闭',
      'Rows':'行数','Columns':'列数','Numeric columns':'数值列','Categorical columns':'类别列','No columns match the filter.':'没有与筛选条件匹配的列。','Choose a target column first.':'请先选择目标列。','Minimum':'最小值','Maximum':'最大值','Grid points':'网格点数','Spacing':'间距方式','Linear':'线性','Logarithmic':'对数','Ridge strength (lambda)':'岭强度（lambda）','Ridge strength':'岭强度','Maximum depth':'最大深度','Minimum rows per leaf':'每个叶节点的最少行数','Candidate thresholds per feature':'每个特征的候选阈值数','Features considered per split':'每次分裂考虑的特征','All':'全部','Number of trees':'树的数量','Row sampling fraction':'行抽样比例','Training percentage':'训练集百分比','Validation percentage':'验证集百分比','Test percentage':'测试集百分比','Choose column…':'选择列…','Source column':'来源列','Regime column':'工况列','Regime split mode':'工况划分模式','Proportional split within each regime':'在每个工况内按比例划分','Hold out complete regimes':'完整保留工况','Time or sequence column':'时间或序列列','Sort direction':'排序方向','Earliest/lowest first':'最早/最小值优先','Latest/highest first':'最新/最大值优先','Source':'来源','Regime':'工况','Coverage':'覆盖率','Mean interval width':'平均区间宽度','Normalised width':'归一化宽度','Coverage error':'覆盖误差','Interval score':'区间评分','Dataset':'数据集','Actual target':'实际目标','Predicted target':'预测目标','Count':'数量','Processed feature':'处理后特征','Relative importance':'相对重要性','Prediction results':'预测结果','Predicted values':'预测值','Lower interval bound':'区间下界','Pointwise uncertainty band':'逐点不确定性带','Missing':'缺失','Covered':'已覆盖','Not covered':'未覆盖','Uncertainty display is turned off.':'不确定性显示已关闭。','Prediction intervals are not available for this fitted artifact.':'此已拟合模型不提供预测区间。'
    },
    'es': {
      'Language':'Idioma','Interface language':'Idioma de la interfaz','Automatic (browser)':'Automático (navegador)',
      'JavaScript is required to run this application.':'Se necesita JavaScript para ejecutar esta aplicación.','Governed browser-only machine learning · v1.0.11':'Aprendizaje automático solo en el navegador · v1.0.11','Prepare CSV data, train regression models, evaluate independent validation and test sets, diagnose errors and uncertainty, then predict unknown data without uploading it.':'Prepare datos CSV, entrene modelos de regresión, evalúe conjuntos independientes de validación y prueba, diagnostique errores e incertidumbre y prediga datos nuevos sin subirlos.','Loading libraries…':'Cargando bibliotecas…','Privacy':'Privacidad','Load data':'Cargar datos','Features':'Variables','Preprocess':'Preprocesar','Model':'Modelo','Split & train':'Dividir y entrenar','Diagnostics':'Diagnóstico','Predict':'Predecir','Local by design':'Local por diseño','CSV contents, models and results stay on this device unless you explicitly save or download a file.':'El contenido CSV, los modelos y los resultados permanecen en este dispositivo salvo que guarde o descargue un archivo explícitamente.',
      'Start and load data':'Iniciar y cargar datos','Drop a CSV here or choose a file':'Suelte un CSV aquí o elija un archivo','Recommended: up to 50,000 rows and 50 original columns':'Recomendado: hasta 50.000 filas y 50 columnas originales','Choose CSV':'Elegir CSV','Open project':'Abrir proyecto','Load fitted model':'Cargar modelo ajustado','Use offline mode — local libraries only':'Usar modo sin conexión — solo bibliotecas locales','Offline mode reloads the app without attempting any CDN request. In either mode, CSV data is never sent to a CDN.':'El modo sin conexión recarga la aplicación sin realizar solicitudes a CDN. En ningún modo se envían datos CSV a una CDN.',
      'Select features and transform the target':'Seleccionar variables y transformar el objetivo','Detect features automatically':'Detectar variables automáticamente','Target column':'Columna objetivo','Choose target…':'Elegir objetivo…','Target transformation':'Transformación del objetivo','None':'Ninguna','Natural logarithm':'Logaritmo natural','Log base 10':'Logaritmo base 10','Square root':'Raíz cuadrada','Feature search':'Buscar variables','Predictions and uncertainty bounds are converted back to the original target scale.':'Las predicciones y los límites de incertidumbre se convierten de nuevo a la escala original del objetivo.','Select all eligible':'Seleccionar todas las aptas','Clear selection':'Borrar selección',
      'Configure preprocessing':'Configurar preprocesamiento','Numeric missing values':'Valores numéricos ausentes','Replace with mean':'Sustituir por la media','Replace with median':'Sustituir por la mediana','Replace with zero':'Sustituir por cero','Drop affected rows':'Eliminar filas afectadas','Numeric scaling fitted on training data':'Escalado numérico ajustado con los datos de entrenamiento','Standardise':'Estandarizar','Min–max scale':'Escalado mín–máx','No scaling':'Sin escalado','Scaling parameters are calculated from the training dataset only. The same fitted scaling is applied unchanged to validation, test and unknown prediction data.':'Los parámetros de escalado se calculan solo con el conjunto de entrenamiento. El mismo escalado se aplica sin cambios a validación, prueba y datos nuevos.','Categorical missing values':'Valores categóricos ausentes','Use “Missing” category':'Usar categoría “Ausente”','Replace with most frequent':'Sustituir por el más frecuente','Categorical encoding':'Codificación categórica','One-hot encoding':'Codificación one-hot','Ordinal integer encoding':'Codificación ordinal entera','Exclude categorical columns':'Excluir columnas categóricas','Maximum categories per column':'Máximo de categorías por columna','Remove one reference category from each categorical feature':'Eliminar una categoría de referencia de cada variable categórica','Recommended for linear and ridge regression to avoid redundant one-hot columns. Usually unnecessary for tree models.':'Recomendado para regresión lineal y ridge a fin de evitar columnas one-hot redundantes. Normalmente no es necesario para árboles.','Select a target and at least one feature to estimate the processed feature count.':'Seleccione un objetivo y al menos una variable para estimar el número de variables procesadas.',
      'Select a model and tune hyperparameters':'Seleccionar un modelo y ajustar hiperparámetros','Linear regression':'Regresión lineal','Fast, interpretable baseline with analytical prediction intervals.':'Base rápida e interpretable con intervalos de predicción analíticos.','Ridge regression':'Regresión ridge','Coefficient shrinkage with bootstrap uncertainty.':'Contracción de coeficientes con incertidumbre bootstrap.','Decision tree':'Árbol de decisión','Nonlinear model with approximate leaf-based intervals.':'Modelo no lineal con intervalos aproximados basados en hojas.','Random forest':'Bosque aleatorio','Tree ensemble with approximate between-tree intervals.':'Conjunto de árboles con intervalos aproximados entre árboles.','Gaussian process':'Proceso gaussiano','Planned advanced module.':'Módulo avanzado planificado.','Simple ANN':'RNA sencilla','Tuning method':'Método de ajuste','Manual configuration':'Configuración manual','Grid search':'Búsqueda en cuadrícula','Ordinary random search':'Búsqueda aleatoria ordinaria','Latin hypercube sampling':'Muestreo de hipercubo latino','Number of search samples':'Número de muestras de búsqueda','Manual configuration selected.':'Configuración manual seleccionada.','Grid values are generated from minimum, maximum and number of points. Tuning compares candidates on the validation set only; the test set remains isolated.':'Los valores de la cuadrícula se generan a partir del mínimo, máximo y número de puntos. El ajuste compara candidatos solo en validación; la prueba permanece aislada.',
      'Split data and train the model':'Dividir datos y entrenar el modelo','Split strategy':'Estrategia de división','Naive random split':'División aleatoria simple','Metadata/source-grouped split':'División agrupada por metadatos/fuente','Regime-aware split':'División consciente del régimen','Time-based split for transient data':'División temporal para datos transitorios','Random seed':'Semilla aleatoria','Run k-fold cross-validation on training data':'Ejecutar validación cruzada k-fold en entrenamiento','Fits preprocessing and the model separately in each fold.':'Ajusta el preprocesamiento y el modelo por separado en cada pliegue.','Number of folds':'Número de pliegues','Prediction uncertainty':'Incertidumbre de predicción','Estimate prediction intervals':'Estimar intervalos de predicción','The method depends on the selected model and is labelled in results.':'El método depende del modelo seleccionado y se identifica en los resultados.','Requested interval coverage':'Cobertura solicitada del intervalo','Bootstrap models for ridge':'Modelos bootstrap para ridge','Choose a split strategy. A split summary will be shown before training.':'Elija una estrategia de división. Se mostrará un resumen antes de entrenar.','Training data fits preprocessing and the model. Validation data selects hyperparameters. Test data is used only for the final independent evaluation.':'Los datos de entrenamiento ajustan el preprocesamiento y el modelo. La validación selecciona hiperparámetros. La prueba solo se usa para la evaluación independiente final.','Preview split':'Vista previa de la división','Train and evaluate':'Entrenar y evaluar','Cancel':'Cancelar',
      'Evaluate and diagnose the model':'Evaluar y diagnosticar el modelo','Diagnostic plot settings':'Configuración de gráficos de diagnóstico','Dataset shown in plots':'Conjunto mostrado en los gráficos','Test':'Prueba','Validation':'Validación','Training':'Entrenamiento','Input feature for residual plot':'Variable de entrada para el gráfico de residuos','Source column for grouped diagnostics':'Columna de fuente para diagnósticos agrupados','No source grouping':'Sin agrupación por fuente','Show uncertainty intervals in plots':'Mostrar intervalos de incertidumbre en los gráficos','This controls only the displayed uncertainty bands and error bars. It does not change the fitted model or uncertainty metrics.':'Solo controla las bandas de incertidumbre y barras de error mostradas. No cambia el modelo ajustado ni las métricas.','Actual vs predicted':'Real frente a predicho','Residuals vs predicted':'Residuos frente a predicho','Residual distribution':'Distribución de residuos','Residual Q–Q plot':'Gráfico Q–Q de residuos','Residuals vs input feature':'Residuos frente a variable de entrada','Residuals by source':'Residuos por fuente','Interval width vs prediction':'Anchura del intervalo frente a predicción','Feature importance':'Importancia de variables','Export results':'Exportar resultados','Download model':'Descargar modelo','Download split predictions':'Descargar predicciones por conjunto','Download metrics':'Descargar métricas','Save project':'Guardar proyecto','Download all plots':'Descargar todos los gráficos','The project file does not contain the original CSV.':'El archivo de proyecto no contiene el CSV original.','It contains configuration, fitted model, predictions and diagnostic results.':'Contiene configuración, modelo ajustado, predicciones y resultados de diagnóstico.',
      'Predict unknown data':'Predecir datos nuevos','Upload prediction CSV':'Subir CSV de predicción','Plot predictions against input feature':'Graficar predicciones frente a una variable de entrada','Optional source/group column':'Columna opcional de fuente/grupo','No grouping':'Sin agrupación','Download predicted values':'Descargar valores predichos','Optional measured-target comparison':'Comparación opcional con objetivo medido','Show measured target values in the plot':'Mostrar valores medidos del objetivo en el gráfico','Measured values are displayed only for comparison. They are not used to fit, update or tune the model.':'Los valores medidos se muestran solo para comparar. No se usan para ajustar, actualizar ni optimizar el modelo.','Measured target column':'Columna del objetivo medido','Choose measured target…':'Elegir objetivo medido…','Train or load a fitted model, then upload a compatible CSV. A measured target column is optional.':'Entrene o cargue un modelo ajustado y después suba un CSV compatible. La columna de objetivo medido es opcional.','Predictions against selected input feature':'Predicciones frente a la variable seleccionada',
      'Privacy and network behaviour':'Privacidad y comportamiento de red','CSV data, preprocessing, training, diagnostics and predictions run in this browser. The app has no analytics, cloud-storage or data-upload endpoint.':'Los datos CSV, el preprocesamiento, entrenamiento, diagnóstico y predicción se ejecutan en este navegador. La aplicación no tiene analítica, almacenamiento en la nube ni endpoint de subida.','Hybrid mode may request public JavaScript libraries from a CDN. Those startup requests do not include CSV data. Offline mode uses only bundled local libraries and makes no CDN attempt.':'El modo híbrido puede solicitar bibliotecas JavaScript públicas a una CDN. Esas solicitudes de inicio no incluyen datos CSV. El modo sin conexión usa solo bibliotecas locales incluidas.','Downloaded projects, models and prediction files may contain sensitive derived information. Store and share them appropriately.':'Los proyectos, modelos y archivos de predicción descargados pueden contener información derivada sensible. Guárdelos y compártalos adecuadamente.','Close':'Cerrar',
      'Rows':'Filas','Columns':'Columnas','Numeric columns':'Columnas numéricas','Categorical columns':'Columnas categóricas','No columns match the filter.':'Ninguna columna coincide con el filtro.','Choose a target column first.':'Elija primero una columna objetivo.','Minimum':'Mínimo','Maximum':'Máximo','Grid points':'Puntos de cuadrícula','Spacing':'Espaciado','Linear':'Lineal','Logarithmic':'Logarítmico','Ridge strength (lambda)':'Intensidad ridge (lambda)','Ridge strength':'Intensidad ridge','Maximum depth':'Profundidad máxima','Minimum rows per leaf':'Filas mínimas por hoja','Candidate thresholds per feature':'Umbrales candidatos por variable','Features considered per split':'Variables consideradas por división','All':'Todas','Number of trees':'Número de árboles','Row sampling fraction':'Fracción de muestreo de filas','Training percentage':'Porcentaje de entrenamiento','Validation percentage':'Porcentaje de validación','Test percentage':'Porcentaje de prueba','Choose column…':'Elegir columna…','Source column':'Columna de fuente','Regime column':'Columna de régimen','Regime split mode':'Modo de división por régimen','Proportional split within each regime':'División proporcional dentro de cada régimen','Hold out complete regimes':'Reservar regímenes completos','Time or sequence column':'Columna de tiempo o secuencia','Sort direction':'Dirección de ordenación','Earliest/lowest first':'Primero el más antiguo/bajo','Latest/highest first':'Primero el más reciente/alto','Source':'Fuente','Regime':'Régimen','Coverage':'Cobertura','Mean interval width':'Anchura media del intervalo','Normalised width':'Anchura normalizada','Coverage error':'Error de cobertura','Interval score':'Puntuación de intervalo','Dataset':'Conjunto','Actual target':'Objetivo real','Predicted target':'Objetivo predicho','Count':'Recuento','Processed feature':'Variable procesada','Relative importance':'Importancia relativa','Prediction results':'Resultados de predicción','Predicted values':'Valores predichos','Lower interval bound':'Límite inferior del intervalo','Pointwise uncertainty band':'Banda de incertidumbre puntual','Missing':'Ausente','Covered':'Cubierto','Not covered':'No cubierto','Uncertainty display is turned off.':'La visualización de incertidumbre está desactivada.','Prediction intervals are not available for this fitted artifact.':'No hay intervalos de predicción disponibles para este modelo ajustado.'
    },
    'fr': {
      'Language':'Langue','Interface language':'Langue de l’interface','Automatic (browser)':'Automatique (navigateur)','JavaScript is required to run this application.':'JavaScript est nécessaire pour exécuter cette application.','Governed browser-only machine learning · v1.0.11':'Apprentissage automatique uniquement dans le navigateur · v1.0.11','Prepare CSV data, train regression models, evaluate independent validation and test sets, diagnose errors and uncertainty, then predict unknown data without uploading it.':'Préparez des données CSV, entraînez des modèles de régression, évaluez des jeux de validation et de test indépendants, diagnostiquez les erreurs et l’incertitude, puis prédisez de nouvelles données sans les téléverser.','Loading libraries…':'Chargement des bibliothèques…','Privacy':'Confidentialité','Load data':'Charger les données','Features':'Variables','Preprocess':'Prétraiter','Model':'Modèle','Split & train':'Diviser et entraîner','Diagnostics':'Diagnostics','Predict':'Prédire','Local by design':'Local par conception','CSV contents, models and results stay on this device unless you explicitly save or download a file.':'Le contenu CSV, les modèles et les résultats restent sur cet appareil sauf si vous enregistrez ou téléchargez explicitement un fichier.',
      'Start and load data':'Démarrer et charger les données','Drop a CSV here or choose a file':'Déposez un CSV ici ou choisissez un fichier','Recommended: up to 50,000 rows and 50 original columns':'Recommandé : jusqu’à 50 000 lignes et 50 colonnes d’origine','Choose CSV':'Choisir un CSV','Open project':'Ouvrir un projet','Load fitted model':'Charger un modèle ajusté','Use offline mode — local libraries only':'Utiliser le mode hors ligne — bibliothèques locales uniquement','Offline mode reloads the app without attempting any CDN request. In either mode, CSV data is never sent to a CDN.':'Le mode hors ligne recharge l’application sans requête CDN. Dans les deux modes, les données CSV ne sont jamais envoyées à un CDN.',
      'Select features and transform the target':'Sélectionner les variables et transformer la cible','Detect features automatically':'Détecter automatiquement les variables','Target column':'Colonne cible','Choose target…':'Choisir la cible…','Target transformation':'Transformation de la cible','None':'Aucune','Natural logarithm':'Logarithme naturel','Log base 10':'Logarithme en base 10','Square root':'Racine carrée','Feature search':'Rechercher des variables','Predictions and uncertainty bounds are converted back to the original target scale.':'Les prédictions et limites d’incertitude sont reconverties à l’échelle d’origine de la cible.','Select all eligible':'Sélectionner toutes les variables admissibles','Clear selection':'Effacer la sélection',
      'Configure preprocessing':'Configurer le prétraitement','Numeric missing values':'Valeurs numériques manquantes','Replace with mean':'Remplacer par la moyenne','Replace with median':'Remplacer par la médiane','Replace with zero':'Remplacer par zéro','Drop affected rows':'Supprimer les lignes concernées','Numeric scaling fitted on training data':'Mise à l’échelle numérique ajustée sur les données d’entraînement','Standardise':'Standardiser','Min–max scale':'Mise à l’échelle min–max','No scaling':'Aucune mise à l’échelle','Scaling parameters are calculated from the training dataset only. The same fitted scaling is applied unchanged to validation, test and unknown prediction data.':'Les paramètres de mise à l’échelle sont calculés uniquement à partir des données d’entraînement. La même transformation est appliquée sans modification aux données de validation, de test et de prédiction.','Categorical missing values':'Valeurs catégorielles manquantes','Use “Missing” category':'Utiliser la catégorie « Manquant »','Replace with most frequent':'Remplacer par la modalité la plus fréquente','Categorical encoding':'Encodage catégoriel','One-hot encoding':'Encodage one-hot','Ordinal integer encoding':'Encodage ordinal entier','Exclude categorical columns':'Exclure les colonnes catégorielles','Maximum categories per column':'Nombre maximal de catégories par colonne','Remove one reference category from each categorical feature':'Retirer une catégorie de référence de chaque variable catégorielle','Recommended for linear and ridge regression to avoid redundant one-hot columns. Usually unnecessary for tree models.':'Recommandé pour les régressions linéaire et ridge afin d’éviter des colonnes one-hot redondantes. Généralement inutile pour les arbres.','Select a target and at least one feature to estimate the processed feature count.':'Sélectionnez une cible et au moins une variable pour estimer le nombre de variables traitées.',
      'Select a model and tune hyperparameters':'Sélectionner un modèle et régler les hyperparamètres','Linear regression':'Régression linéaire','Fast, interpretable baseline with analytical prediction intervals.':'Référence rapide et interprétable avec intervalles de prédiction analytiques.','Ridge regression':'Régression ridge','Coefficient shrinkage with bootstrap uncertainty.':'Réduction des coefficients avec incertitude bootstrap.','Decision tree':'Arbre de décision','Nonlinear model with approximate leaf-based intervals.':'Modèle non linéaire avec intervalles approximatifs fondés sur les feuilles.','Random forest':'Forêt aléatoire','Tree ensemble with approximate between-tree intervals.':'Ensemble d’arbres avec intervalles approximatifs entre arbres.','Gaussian process':'Processus gaussien','Planned advanced module.':'Module avancé prévu.','Simple ANN':'RNA simple','Tuning method':'Méthode de réglage','Manual configuration':'Configuration manuelle','Grid search':'Recherche sur grille','Ordinary random search':'Recherche aléatoire ordinaire','Latin hypercube sampling':'Échantillonnage par hypercube latin','Number of search samples':'Nombre d’échantillons de recherche','Manual configuration selected.':'Configuration manuelle sélectionnée.','Grid values are generated from minimum, maximum and number of points. Tuning compares candidates on the validation set only; the test set remains isolated.':'Les valeurs de grille sont générées à partir du minimum, du maximum et du nombre de points. Le réglage compare les candidats uniquement sur la validation ; le test reste isolé.',
      'Split data and train the model':'Diviser les données et entraîner le modèle','Split strategy':'Stratégie de division','Naive random split':'Division aléatoire simple','Metadata/source-grouped split':'Division groupée par métadonnées/source','Regime-aware split':'Division tenant compte du régime','Time-based split for transient data':'Division temporelle pour données transitoires','Random seed':'Graine aléatoire','Run k-fold cross-validation on training data':'Exécuter une validation croisée k-fold sur l’entraînement','Fits preprocessing and the model separately in each fold.':'Ajuste séparément le prétraitement et le modèle dans chaque pli.','Number of folds':'Nombre de plis','Prediction uncertainty':'Incertitude de prédiction','Estimate prediction intervals':'Estimer les intervalles de prédiction','The method depends on the selected model and is labelled in results.':'La méthode dépend du modèle sélectionné et est indiquée dans les résultats.','Requested interval coverage':'Couverture d’intervalle demandée','Bootstrap models for ridge':'Modèles bootstrap pour ridge','Choose a split strategy. A split summary will be shown before training.':'Choisissez une stratégie de division. Un résumé sera affiché avant l’entraînement.','Training data fits preprocessing and the model. Validation data selects hyperparameters. Test data is used only for the final independent evaluation.':'Les données d’entraînement ajustent le prétraitement et le modèle. La validation sélectionne les hyperparamètres. Le test sert uniquement à l’évaluation indépendante finale.','Preview split':'Prévisualiser la division','Train and evaluate':'Entraîner et évaluer','Cancel':'Annuler',
      'Evaluate and diagnose the model':'Évaluer et diagnostiquer le modèle','Diagnostic plot settings':'Paramètres des graphiques de diagnostic','Dataset shown in plots':'Jeu de données affiché dans les graphiques','Test':'Test','Validation':'Validation','Training':'Entraînement','Input feature for residual plot':'Variable d’entrée du graphique des résidus','Source column for grouped diagnostics':'Colonne source pour diagnostics groupés','No source grouping':'Aucun regroupement par source','Show uncertainty intervals in plots':'Afficher les intervalles d’incertitude dans les graphiques','This controls only the displayed uncertainty bands and error bars. It does not change the fitted model or uncertainty metrics.':'Ce réglage contrôle uniquement les bandes d’incertitude et barres d’erreur affichées. Il ne modifie ni le modèle ajusté ni les métriques.','Actual vs predicted':'Réel et prédit','Residuals vs predicted':'Résidus et valeurs prédites','Residual distribution':'Distribution des résidus','Residual Q–Q plot':'Graphique Q–Q des résidus','Residuals vs input feature':'Résidus et variable d’entrée','Residuals by source':'Résidus par source','Interval width vs prediction':'Largeur d’intervalle et prédiction','Feature importance':'Importance des variables','Export results':'Exporter les résultats','Download model':'Télécharger le modèle','Download split predictions':'Télécharger les prédictions par jeu','Download metrics':'Télécharger les métriques','Save project':'Enregistrer le projet','Download all plots':'Télécharger tous les graphiques','The project file does not contain the original CSV.':'Le fichier de projet ne contient pas le CSV d’origine.','It contains configuration, fitted model, predictions and diagnostic results.':'Il contient la configuration, le modèle ajusté, les prédictions et les résultats de diagnostic.',
      'Predict unknown data':'Prédire de nouvelles données','Upload prediction CSV':'Téléverser le CSV de prédiction','Plot predictions against input feature':'Tracer les prédictions selon une variable d’entrée','Optional source/group column':'Colonne source/groupe facultative','No grouping':'Aucun regroupement','Download predicted values':'Télécharger les valeurs prédites','Optional measured-target comparison':'Comparaison facultative avec la cible mesurée','Show measured target values in the plot':'Afficher les valeurs mesurées de la cible dans le graphique','Measured values are displayed only for comparison. They are not used to fit, update or tune the model.':'Les valeurs mesurées sont affichées uniquement pour comparaison. Elles ne servent pas à ajuster, mettre à jour ou régler le modèle.','Measured target column':'Colonne de cible mesurée','Choose measured target…':'Choisir la cible mesurée…','Train or load a fitted model, then upload a compatible CSV. A measured target column is optional.':'Entraînez ou chargez un modèle ajusté, puis téléversez un CSV compatible. La colonne de cible mesurée est facultative.','Predictions against selected input feature':'Prédictions selon la variable d’entrée sélectionnée',
      'Privacy and network behaviour':'Confidentialité et comportement réseau','CSV data, preprocessing, training, diagnostics and predictions run in this browser. The app has no analytics, cloud-storage or data-upload endpoint.':'Les données CSV, le prétraitement, l’entraînement, les diagnostics et les prédictions s’exécutent dans ce navigateur. L’application ne dispose d’aucun service d’analyse, stockage cloud ou téléversement.','Hybrid mode may request public JavaScript libraries from a CDN. Those startup requests do not include CSV data. Offline mode uses only bundled local libraries and makes no CDN attempt.':'Le mode hybride peut demander des bibliothèques JavaScript publiques à un CDN. Ces requêtes de démarrage n’incluent pas les données CSV. Le mode hors ligne utilise uniquement les bibliothèques locales incluses.','Downloaded projects, models and prediction files may contain sensitive derived information. Store and share them appropriately.':'Les projets, modèles et fichiers de prédiction téléchargés peuvent contenir des informations dérivées sensibles. Stockez-les et partagez-les de manière appropriée.','Close':'Fermer',
      'Rows':'Lignes','Columns':'Colonnes','Numeric columns':'Colonnes numériques','Categorical columns':'Colonnes catégorielles','No columns match the filter.':'Aucune colonne ne correspond au filtre.','Choose a target column first.':'Choisissez d’abord une colonne cible.','Minimum':'Minimum','Maximum':'Maximum','Grid points':'Points de grille','Spacing':'Espacement','Linear':'Linéaire','Logarithmic':'Logarithmique','Ridge strength (lambda)':'Force ridge (lambda)','Ridge strength':'Force ridge','Maximum depth':'Profondeur maximale','Minimum rows per leaf':'Nombre minimal de lignes par feuille','Candidate thresholds per feature':'Seuils candidats par variable','Features considered per split':'Variables considérées par division','All':'Toutes','Number of trees':'Nombre d’arbres','Row sampling fraction':'Fraction d’échantillonnage des lignes','Training percentage':'Pourcentage d’entraînement','Validation percentage':'Pourcentage de validation','Test percentage':'Pourcentage de test','Choose column…':'Choisir une colonne…','Source column':'Colonne source','Regime column':'Colonne de régime','Regime split mode':'Mode de division par régime','Proportional split within each regime':'Division proportionnelle dans chaque régime','Hold out complete regimes':'Réserver des régimes complets','Time or sequence column':'Colonne de temps ou de séquence','Sort direction':'Sens du tri','Earliest/lowest first':'Plus ancien/faible en premier','Latest/highest first':'Plus récent/élevé en premier','Source':'Source','Regime':'Régime','Coverage':'Couverture','Mean interval width':'Largeur moyenne de l’intervalle','Normalised width':'Largeur normalisée','Coverage error':'Erreur de couverture','Interval score':'Score d’intervalle','Dataset':'Jeu de données','Actual target':'Cible réelle','Predicted target':'Cible prédite','Count':'Nombre','Processed feature':'Variable traitée','Relative importance':'Importance relative','Prediction results':'Résultats de prédiction','Predicted values':'Valeurs prédites','Lower interval bound':'Borne inférieure de l’intervalle','Pointwise uncertainty band':'Bande d’incertitude point par point','Missing':'Manquant','Covered':'Couvert','Not covered':'Non couvert','Uncertainty display is turned off.':'L’affichage de l’incertitude est désactivé.','Prediction intervals are not available for this fitted artifact.':'Aucun intervalle de prédiction n’est disponible pour ce modèle ajusté.'
    },
    'de': {
      'Language':'Sprache','Interface language':'Oberflächensprache','Automatic (browser)':'Automatisch (Browser)','JavaScript is required to run this application.':'JavaScript ist zum Ausführen dieser Anwendung erforderlich.','Governed browser-only machine learning · v1.0.11':'Maschinelles Lernen nur im Browser · v1.0.11','Prepare CSV data, train regression models, evaluate independent validation and test sets, diagnose errors and uncertainty, then predict unknown data without uploading it.':'Bereiten Sie CSV-Daten auf, trainieren Sie Regressionsmodelle, bewerten Sie unabhängige Validierungs- und Testdaten, diagnostizieren Sie Fehler und Unsicherheit und prognostizieren Sie neue Daten, ohne sie hochzuladen.','Loading libraries…':'Bibliotheken werden geladen…','Privacy':'Datenschutz','Load data':'Daten laden','Features':'Merkmale','Preprocess':'Vorverarbeiten','Model':'Modell','Split & train':'Aufteilen und trainieren','Diagnostics':'Diagnose','Predict':'Prognose','Local by design':'Lokal konzipiert','CSV contents, models and results stay on this device unless you explicitly save or download a file.':'CSV-Inhalte, Modelle und Ergebnisse verbleiben auf diesem Gerät, sofern Sie nicht ausdrücklich eine Datei speichern oder herunterladen.',
      'Start and load data':'Starten und Daten laden','Drop a CSV here or choose a file':'CSV hier ablegen oder Datei auswählen','Recommended: up to 50,000 rows and 50 original columns':'Empfohlen: bis zu 50.000 Zeilen und 50 Originalspalten','Choose CSV':'CSV auswählen','Open project':'Projekt öffnen','Load fitted model':'Angepasstes Modell laden','Use offline mode — local libraries only':'Offline-Modus verwenden — nur lokale Bibliotheken','Offline mode reloads the app without attempting any CDN request. In either mode, CSV data is never sent to a CDN.':'Der Offline-Modus lädt die Anwendung neu, ohne eine CDN-Anfrage zu versuchen. CSV-Daten werden in keinem Modus an ein CDN gesendet.',
      'Select features and transform the target':'Merkmale auswählen und Ziel transformieren','Detect features automatically':'Merkmale automatisch erkennen','Target column':'Zielspalte','Choose target…':'Ziel auswählen…','Target transformation':'Zieltransformation','None':'Keine','Natural logarithm':'Natürlicher Logarithmus','Log base 10':'Logarithmus zur Basis 10','Square root':'Quadratwurzel','Feature search':'Merkmale suchen','Predictions and uncertainty bounds are converted back to the original target scale.':'Prognosen und Unsicherheitsgrenzen werden auf die ursprüngliche Zielskala zurücktransformiert.','Select all eligible':'Alle geeigneten auswählen','Clear selection':'Auswahl löschen',
      'Configure preprocessing':'Vorverarbeitung konfigurieren','Numeric missing values':'Fehlende numerische Werte','Replace with mean':'Durch Mittelwert ersetzen','Replace with median':'Durch Median ersetzen','Replace with zero':'Durch null ersetzen','Drop affected rows':'Betroffene Zeilen entfernen','Numeric scaling fitted on training data':'An Trainingsdaten angepasste numerische Skalierung','Standardise':'Standardisieren','Min–max scale':'Min-Max-Skalierung','No scaling':'Keine Skalierung','Scaling parameters are calculated from the training dataset only. The same fitted scaling is applied unchanged to validation, test and unknown prediction data.':'Skalierungsparameter werden nur aus den Trainingsdaten berechnet. Dieselbe angepasste Skalierung wird unverändert auf Validierungs-, Test- und neue Prognosedaten angewendet.','Categorical missing values':'Fehlende kategoriale Werte','Use “Missing” category':'Kategorie „Fehlend“ verwenden','Replace with most frequent':'Durch häufigsten Wert ersetzen','Categorical encoding':'Kategoriale Kodierung','One-hot encoding':'One-Hot-Kodierung','Ordinal integer encoding':'Ordinale Ganzzahlkodierung','Exclude categorical columns':'Kategoriale Spalten ausschließen','Maximum categories per column':'Maximale Kategorien pro Spalte','Remove one reference category from each categorical feature':'Eine Referenzkategorie je kategorialem Merkmal entfernen','Recommended for linear and ridge regression to avoid redundant one-hot columns. Usually unnecessary for tree models.':'Für lineare und Ridge-Regression empfohlen, um redundante One-Hot-Spalten zu vermeiden. Für Baummodelle meist unnötig.','Select a target and at least one feature to estimate the processed feature count.':'Wählen Sie ein Ziel und mindestens ein Merkmal, um die Anzahl verarbeiteter Merkmale zu schätzen.',
      'Select a model and tune hyperparameters':'Modell auswählen und Hyperparameter abstimmen','Linear regression':'Lineare Regression','Fast, interpretable baseline with analytical prediction intervals.':'Schnelle, interpretierbare Basis mit analytischen Prognoseintervallen.','Ridge regression':'Ridge-Regression','Coefficient shrinkage with bootstrap uncertainty.':'Koeffizientenschrumpfung mit Bootstrap-Unsicherheit.','Decision tree':'Entscheidungsbaum','Nonlinear model with approximate leaf-based intervals.':'Nichtlineares Modell mit approximativen blattbasierten Intervallen.','Random forest':'Random Forest','Tree ensemble with approximate between-tree intervals.':'Baumensemble mit approximativen Intervallen zwischen Bäumen.','Gaussian process':'Gauß-Prozess','Planned advanced module.':'Geplantes erweitertes Modul.','Simple ANN':'Einfaches KNN','Tuning method':'Abstimmungsmethode','Manual configuration':'Manuelle Konfiguration','Grid search':'Rastersuche','Ordinary random search':'Gewöhnliche Zufallssuche','Latin hypercube sampling':'Latin-Hypercube-Sampling','Number of search samples':'Anzahl Suchstichproben','Manual configuration selected.':'Manuelle Konfiguration ausgewählt.','Grid values are generated from minimum, maximum and number of points. Tuning compares candidates on the validation set only; the test set remains isolated.':'Rasterwerte werden aus Minimum, Maximum und Punktzahl erzeugt. Die Abstimmung vergleicht Kandidaten nur auf dem Validierungssatz; der Testsatz bleibt isoliert.',
      'Split data and train the model':'Daten aufteilen und Modell trainieren','Split strategy':'Aufteilungsstrategie','Naive random split':'Einfache Zufallsaufteilung','Metadata/source-grouped split':'Nach Metadaten/Quelle gruppierte Aufteilung','Regime-aware split':'Regimebewusste Aufteilung','Time-based split for transient data':'Zeitbasierte Aufteilung für transiente Daten','Random seed':'Zufallsstartwert','Run k-fold cross-validation on training data':'K-fache Kreuzvalidierung auf Trainingsdaten ausführen','Fits preprocessing and the model separately in each fold.':'Passt Vorverarbeitung und Modell in jedem Fold getrennt an.','Number of folds':'Anzahl Folds','Prediction uncertainty':'Prognoseunsicherheit','Estimate prediction intervals':'Prognoseintervalle schätzen','The method depends on the selected model and is labelled in results.':'Die Methode hängt vom gewählten Modell ab und wird in den Ergebnissen angegeben.','Requested interval coverage':'Gewünschte Intervallabdeckung','Bootstrap models for ridge':'Bootstrap-Modelle für Ridge','Choose a split strategy. A split summary will be shown before training.':'Wählen Sie eine Aufteilungsstrategie. Vor dem Training wird eine Zusammenfassung angezeigt.','Training data fits preprocessing and the model. Validation data selects hyperparameters. Test data is used only for the final independent evaluation.':'Trainingsdaten passen Vorverarbeitung und Modell an. Validierungsdaten wählen Hyperparameter. Testdaten werden nur für die abschließende unabhängige Bewertung verwendet.','Preview split':'Aufteilung prüfen','Train and evaluate':'Trainieren und bewerten','Cancel':'Abbrechen',
      'Evaluate and diagnose the model':'Modell bewerten und diagnostizieren','Diagnostic plot settings':'Einstellungen der Diagnosegrafiken','Dataset shown in plots':'In Grafiken angezeigter Datensatz','Test':'Test','Validation':'Validierung','Training':'Training','Input feature for residual plot':'Eingangsmerkmal für Residualgrafik','Source column for grouped diagnostics':'Quellspalte für gruppierte Diagnosen','No source grouping':'Keine Gruppierung nach Quelle','Show uncertainty intervals in plots':'Unsicherheitsintervalle in Grafiken anzeigen','This controls only the displayed uncertainty bands and error bars. It does not change the fitted model or uncertainty metrics.':'Dies steuert nur die angezeigten Unsicherheitsbänder und Fehlerbalken. Das angepasste Modell und die Unsicherheitsmetriken bleiben unverändert.','Actual vs predicted':'Ist gegen Prognose','Residuals vs predicted':'Residuen gegen Prognose','Residual distribution':'Residuenverteilung','Residual Q–Q plot':'Q–Q-Diagramm der Residuen','Residuals vs input feature':'Residuen gegen Eingangsmerkmal','Residuals by source':'Residuen nach Quelle','Interval width vs prediction':'Intervallbreite gegen Prognose','Feature importance':'Merkmalswichtigkeit','Export results':'Ergebnisse exportieren','Download model':'Modell herunterladen','Download split predictions':'Datensatzprognosen herunterladen','Download metrics':'Metriken herunterladen','Save project':'Projekt speichern','Download all plots':'Alle Grafiken herunterladen','The project file does not contain the original CSV.':'Die Projektdatei enthält nicht die ursprüngliche CSV.','It contains configuration, fitted model, predictions and diagnostic results.':'Sie enthält Konfiguration, angepasstes Modell, Prognosen und Diagnoseergebnisse.',
      'Predict unknown data':'Neue Daten prognostizieren','Upload prediction CSV':'Prognose-CSV hochladen','Plot predictions against input feature':'Prognosen gegen Eingangsmerkmal darstellen','Optional source/group column':'Optionale Quellen-/Gruppenspalte','No grouping':'Keine Gruppierung','Download predicted values':'Prognosewerte herunterladen','Optional measured-target comparison':'Optionaler Vergleich mit gemessenem Ziel','Show measured target values in the plot':'Gemessene Zielwerte in der Grafik anzeigen','Measured values are displayed only for comparison. They are not used to fit, update or tune the model.':'Gemessene Werte werden nur zum Vergleich angezeigt. Sie werden nicht zum Anpassen, Aktualisieren oder Abstimmen des Modells verwendet.','Measured target column':'Spalte des gemessenen Ziels','Choose measured target…':'Gemessenes Ziel auswählen…','Train or load a fitted model, then upload a compatible CSV. A measured target column is optional.':'Trainieren oder laden Sie ein angepasstes Modell und laden Sie dann eine kompatible CSV hoch. Eine Spalte mit gemessenem Ziel ist optional.','Predictions against selected input feature':'Prognosen gegen ausgewähltes Eingangsmerkmal',
      'Privacy and network behaviour':'Datenschutz und Netzwerkverhalten','CSV data, preprocessing, training, diagnostics and predictions run in this browser. The app has no analytics, cloud-storage or data-upload endpoint.':'CSV-Daten, Vorverarbeitung, Training, Diagnose und Prognose laufen in diesem Browser. Die Anwendung besitzt keine Analyse-, Cloudspeicher- oder Upload-Schnittstelle.','Hybrid mode may request public JavaScript libraries from a CDN. Those startup requests do not include CSV data. Offline mode uses only bundled local libraries and makes no CDN attempt.':'Im Hybridmodus können öffentliche JavaScript-Bibliotheken von einem CDN angefordert werden. Diese Startanfragen enthalten keine CSV-Daten. Der Offline-Modus verwendet nur mitgelieferte lokale Bibliotheken.','Downloaded projects, models and prediction files may contain sensitive derived information. Store and share them appropriately.':'Heruntergeladene Projekte, Modelle und Prognosedateien können sensible abgeleitete Informationen enthalten. Speichern und teilen Sie sie angemessen.','Close':'Schließen',
      'Rows':'Zeilen','Columns':'Spalten','Numeric columns':'Numerische Spalten','Categorical columns':'Kategoriale Spalten','No columns match the filter.':'Keine Spalten entsprechen dem Filter.','Choose a target column first.':'Wählen Sie zuerst eine Zielspalte.','Minimum':'Minimum','Maximum':'Maximum','Grid points':'Rasterpunkte','Spacing':'Abstand','Linear':'Linear','Logarithmic':'Logarithmisch','Ridge strength (lambda)':'Ridge-Stärke (Lambda)','Ridge strength':'Ridge-Stärke','Maximum depth':'Maximale Tiefe','Minimum rows per leaf':'Minimale Zeilen pro Blatt','Candidate thresholds per feature':'Schwellenkandidaten pro Merkmal','Features considered per split':'Pro Teilung berücksichtigte Merkmale','All':'Alle','Number of trees':'Anzahl Bäume','Row sampling fraction':'Zeilen-Stichprobenanteil','Training percentage':'Trainingsanteil','Validation percentage':'Validierungsanteil','Test percentage':'Testanteil','Choose column…':'Spalte auswählen…','Source column':'Quellspalte','Regime column':'Regimespalte','Regime split mode':'Regime-Aufteilungsmodus','Proportional split within each regime':'Proportionale Aufteilung innerhalb jedes Regimes','Hold out complete regimes':'Vollständige Regime zurückhalten','Time or sequence column':'Zeit- oder Sequenzspalte','Sort direction':'Sortierrichtung','Earliest/lowest first':'Früheste/niedrigste zuerst','Latest/highest first':'Neueste/höchste zuerst','Source':'Quelle','Regime':'Regime','Coverage':'Abdeckung','Mean interval width':'Mittlere Intervallbreite','Normalised width':'Normalisierte Breite','Coverage error':'Abdeckungsfehler','Interval score':'Intervallscore','Dataset':'Datensatz','Actual target':'Ist-Ziel','Predicted target':'Prognoseziel','Count':'Anzahl','Processed feature':'Verarbeitetes Merkmal','Relative importance':'Relative Wichtigkeit','Prediction results':'Prognoseergebnisse','Predicted values':'Prognosewerte','Lower interval bound':'Untere Intervallgrenze','Pointwise uncertainty band':'Punktweises Unsicherheitsband','Missing':'Fehlend','Covered':'Abgedeckt','Not covered':'Nicht abgedeckt','Uncertainty display is turned off.':'Die Unsicherheitsanzeige ist ausgeschaltet.','Prediction intervals are not available for this fitted artifact.':'Für dieses angepasste Modell sind keine Prognoseintervalle verfügbar.'
    }
  };

  const advancedTranslations = {
    'zh-CN': {
      'Dataset fingerprint':'数据集指纹','Download experiment record':'下载实验记录','Experiment ID':'实验 ID','Application version':'应用版本','Training job':'训练任务','Saved experiments':'已保存实验','Stochastic kernel-search iterations':'随机核参数搜索迭代次数','Uses seeded random multiplicative proposals and keeps changes that reduce negative log marginal likelihood. It does not use gradients, so no learning rate is required.':'使用带种子的随机乘法提议，并保留能降低负对数边际似然的更改。该方法不使用梯度，因此不需要学习率。',
      'Exact or representative-subset GP with native predictive uncertainty.':'精确或代表性子集高斯过程，提供原生预测不确定性。',
      'Feed-forward dense network with early stopping and approximate uncertainty.':'带早停和近似不确定性的前馈全连接网络。',
      'GP training mode':'高斯过程训练模式','Exact GP':'精确高斯过程','Representative-subset GP':'代表性子集高斯过程','Automatically optimise subset size':'自动优化子集大小',
      'Kernel':'核函数','RBF / squared exponential':'RBF / 平方指数','Matérn 3/2':'Matérn 3/2','Matérn 5/2':'Matérn 5/2','Rational quadratic':'有理二次','Linear kernel':'线性核',
      'Length scale':'长度尺度','Signal variance':'信号方差','Observation-noise standard deviation':'观测噪声标准差','Numerical jitter':'数值抖动项','Kernel optimisation iterations':'核参数优化迭代次数','Rational-quadratic alpha':'有理二次 alpha',
      'Representative subset size':'代表性子集大小','Subset selection':'子集选择','Farthest-point sampling':'最远点抽样','K-means++ representative sampling':'K-means++ 代表性抽样','Random sampling':'随机抽样',
      'Automatic subset minimum':'自动子集最小值','Automatic subset maximum':'自动子集最大值','Subset sizes evaluated':'评估的子集大小数量','Validation tolerance for smaller subset':'选择较小子集的验证容差',
      'Artificial neural network':'人工神经网络','Hidden layer 1 neurons':'隐藏层 1 神经元数','Hidden layer 2 neurons':'隐藏层 2 神经元数','Hidden layer 3 neurons':'隐藏层 3 神经元数','Activation function':'激活函数',
      'Leaky ReLU':'Leaky ReLU','Optimiser':'优化器','Stochastic gradient descent':'随机梯度下降','Learning rate':'学习率','Batch size':'批量大小','Maximum epochs':'最大训练轮数','Dropout rate':'Dropout 比率','L2 regularisation':'L2 正则化',
      'Early-stopping patience':'早停耐心轮数','Minimum validation improvement':'最小验证改进','ANN uncertainty method':'神经网络不确定性方法','Monte Carlo dropout':'蒙特卡洛 Dropout','Small deep ensemble':'小型深度集成','Monte Carlo dropout passes':'蒙特卡洛 Dropout 次数','Ensemble members':'集成成员数',
      'Training and optimisation history':'训练与优化历史','Training loss':'训练损失','Validation loss':'验证损失','Mean squared loss':'均方损失','Epoch':'训练轮次','Optimisation iteration':'优化迭代','Negative log marginal likelihood':'负对数边际似然','Number of trees':'树的数量','Maximum tree depth':'最大树深度','Candidate trial':'候选试验','Validation RMSE':'验证 RMSE',
      'Native Gaussian-process predictive interval':'原生高斯过程预测区间','Approximate Monte Carlo dropout interval':'近似蒙特卡洛 Dropout 区间','Approximate neural-network ensemble interval':'近似神经网络集成区间'
    },
    'es': {
      'Dataset fingerprint':'Huella digital del conjunto de datos','Download experiment record':'Descargar registro del experimento','Experiment ID':'ID del experimento','Application version':'Versión de la aplicación','Training job':'Trabajo de entrenamiento','Saved experiments':'Experimentos guardados','Stochastic kernel-search iterations':'Iteraciones de búsqueda estocástica del núcleo','Uses seeded random multiplicative proposals and keeps changes that reduce negative log marginal likelihood. It does not use gradients, so no learning rate is required.':'Utiliza propuestas multiplicativas aleatorias con semilla y conserva los cambios que reducen la log-verosimilitud marginal negativa. No utiliza gradientes, por lo que no requiere tasa de aprendizaje.',
      'Exact or representative-subset GP with native predictive uncertainty.':'GP exacto o con subconjunto representativo e incertidumbre predictiva nativa.',
      'Feed-forward dense network with early stopping and approximate uncertainty.':'Red densa prealimentada con parada temprana e incertidumbre aproximada.',
      'GP training mode':'Modo de entrenamiento GP','Exact GP':'GP exacto','Representative-subset GP':'GP con subconjunto representativo','Automatically optimise subset size':'Optimizar automáticamente el tamaño del subconjunto',
      'Kernel':'Núcleo','RBF / squared exponential':'RBF / exponencial cuadrado','Rational quadratic':'Cuadrático racional','Linear kernel':'Núcleo lineal','Length scale':'Escala de longitud','Signal variance':'Varianza de señal','Observation-noise standard deviation':'Desviación estándar del ruido de observación','Numerical jitter':'Jitter numérico','Kernel optimisation iterations':'Iteraciones de optimización del núcleo','Rational-quadratic alpha':'Alfa cuadrático racional',
      'Representative subset size':'Tamaño del subconjunto representativo','Subset selection':'Selección del subconjunto','Farthest-point sampling':'Muestreo por puntos más alejados','K-means++ representative sampling':'Muestreo representativo K-means++','Random sampling':'Muestreo aleatorio','Automatic subset minimum':'Mínimo automático del subconjunto','Automatic subset maximum':'Máximo automático del subconjunto','Subset sizes evaluated':'Tamaños de subconjunto evaluados','Validation tolerance for smaller subset':'Tolerancia de validación para un subconjunto menor',
      'Artificial neural network':'Red neuronal artificial','Hidden layer 1 neurons':'Neuronas de la capa oculta 1','Hidden layer 2 neurons':'Neuronas de la capa oculta 2','Hidden layer 3 neurons':'Neuronas de la capa oculta 3','Activation function':'Función de activación','Optimiser':'Optimizador','Stochastic gradient descent':'Descenso de gradiente estocástico','Learning rate':'Tasa de aprendizaje','Batch size':'Tamaño de lote','Maximum epochs':'Épocas máximas','Dropout rate':'Tasa de dropout','L2 regularisation':'Regularización L2','Early-stopping patience':'Paciencia de parada temprana','Minimum validation improvement':'Mejora mínima de validación','ANN uncertainty method':'Método de incertidumbre de la RNA','Monte Carlo dropout':'Dropout Monte Carlo','Small deep ensemble':'Pequeño conjunto profundo','Monte Carlo dropout passes':'Pasadas de dropout Monte Carlo','Ensemble members':'Miembros del conjunto',
      'Training and optimisation history':'Historial de entrenamiento y optimización','Training loss':'Pérdida de entrenamiento','Validation loss':'Pérdida de validación','Mean squared loss':'Pérdida cuadrática media','Epoch':'Época','Optimisation iteration':'Iteración de optimización','Negative log marginal likelihood':'Log-verosimilitud marginal negativa','Maximum tree depth':'Profundidad máxima del árbol','Candidate trial':'Ensayo candidato','Validation RMSE':'RMSE de validación',
      'Native Gaussian-process predictive interval':'Intervalo predictivo nativo del proceso gaussiano','Approximate Monte Carlo dropout interval':'Intervalo aproximado de dropout Monte Carlo','Approximate neural-network ensemble interval':'Intervalo aproximado del conjunto neuronal'
    },
    'fr': {
      'Dataset fingerprint':'Empreinte du jeu de données','Download experiment record':'Télécharger le dossier d’expérience','Experiment ID':'ID de l’expérience','Application version':'Version de l’application','Training job':'Tâche d’entraînement','Saved experiments':'Expériences enregistrées','Stochastic kernel-search iterations':'Itérations de recherche stochastique du noyau','Uses seeded random multiplicative proposals and keeps changes that reduce negative log marginal likelihood. It does not use gradients, so no learning rate is required.':'Utilise des propositions multiplicatives aléatoires initialisées et conserve les changements qui réduisent la log-vraisemblance marginale négative. Cette méthode n’utilise pas de gradients et ne nécessite donc pas de taux d’apprentissage.',
      'Exact or representative-subset GP with native predictive uncertainty.':'Processus gaussien exact ou sur sous-ensemble représentatif avec incertitude prédictive native.',
      'Feed-forward dense network with early stopping and approximate uncertainty.':'Réseau dense à propagation avant avec arrêt précoce et incertitude approximative.',
      'GP training mode':'Mode d’entraînement GP','Exact GP':'GP exact','Representative-subset GP':'GP sur sous-ensemble représentatif','Automatically optimise subset size':'Optimiser automatiquement la taille du sous-ensemble','Kernel':'Noyau','RBF / squared exponential':'RBF / exponentiel quadratique','Rational quadratic':'Quadratique rationnel','Linear kernel':'Noyau linéaire','Length scale':'Échelle de longueur','Signal variance':'Variance du signal','Observation-noise standard deviation':'Écart-type du bruit d’observation','Numerical jitter':'Jitter numérique','Kernel optimisation iterations':'Itérations d’optimisation du noyau','Rational-quadratic alpha':'Alpha quadratique rationnel','Representative subset size':'Taille du sous-ensemble représentatif','Subset selection':'Sélection du sous-ensemble','Farthest-point sampling':'Échantillonnage par points les plus éloignés','K-means++ representative sampling':'Échantillonnage représentatif K-means++','Random sampling':'Échantillonnage aléatoire','Automatic subset minimum':'Minimum automatique du sous-ensemble','Automatic subset maximum':'Maximum automatique du sous-ensemble','Subset sizes evaluated':'Tailles de sous-ensemble évaluées','Validation tolerance for smaller subset':'Tolérance de validation pour un sous-ensemble plus petit',
      'Artificial neural network':'Réseau neuronal artificiel','Hidden layer 1 neurons':'Neurones de la couche cachée 1','Hidden layer 2 neurons':'Neurones de la couche cachée 2','Hidden layer 3 neurons':'Neurones de la couche cachée 3','Activation function':'Fonction d’activation','Optimiser':'Optimiseur','Stochastic gradient descent':'Descente de gradient stochastique','Learning rate':'Taux d’apprentissage','Batch size':'Taille du lot','Maximum epochs':'Nombre maximal d’époques','Dropout rate':'Taux de dropout','L2 regularisation':'Régularisation L2','Early-stopping patience':'Patience de l’arrêt précoce','Minimum validation improvement':'Amélioration minimale de validation','ANN uncertainty method':'Méthode d’incertitude du réseau','Monte Carlo dropout':'Dropout Monte Carlo','Small deep ensemble':'Petit ensemble profond','Monte Carlo dropout passes':'Passages de dropout Monte Carlo','Ensemble members':'Membres de l’ensemble',
      'Training and optimisation history':'Historique d’entraînement et d’optimisation','Training loss':'Perte d’entraînement','Validation loss':'Perte de validation','Mean squared loss':'Perte quadratique moyenne','Epoch':'Époque','Optimisation iteration':'Itération d’optimisation','Negative log marginal likelihood':'Log-vraisemblance marginale négative','Maximum tree depth':'Profondeur maximale de l’arbre','Candidate trial':'Essai candidat','Validation RMSE':'RMSE de validation','Native Gaussian-process predictive interval':'Intervalle prédictif natif du processus gaussien','Approximate Monte Carlo dropout interval':'Intervalle approximatif par dropout Monte Carlo','Approximate neural-network ensemble interval':'Intervalle approximatif d’ensemble neuronal'
    },
    'de': {
      'Dataset fingerprint':'Datensatz-Fingerabdruck','Download experiment record':'Versuchsdatensatz herunterladen','Experiment ID':'Versuchs-ID','Application version':'Anwendungsversion','Training job':'Trainingsauftrag','Saved experiments':'Gespeicherte Versuche','Stochastic kernel-search iterations':'Iterationen der stochastischen Kernel-Suche','Uses seeded random multiplicative proposals and keeps changes that reduce negative log marginal likelihood. It does not use gradients, so no learning rate is required.':'Verwendet gesetzte zufällige multiplikative Vorschläge und behält Änderungen bei, die die negative logarithmische Marginal-Likelihood verringern. Es werden keine Gradienten verwendet, daher ist keine Lernrate erforderlich.',
      'Exact or representative-subset GP with native predictive uncertainty.':'Exakter oder repräsentativer Teilmengen-GP mit nativer Prognoseunsicherheit.',
      'Feed-forward dense network with early stopping and approximate uncertainty.':'Dichtes Feedforward-Netz mit Early Stopping und näherungsweiser Unsicherheit.',
      'GP training mode':'GP-Trainingsmodus','Exact GP':'Exakter GP','Representative-subset GP':'GP mit repräsentativer Teilmenge','Automatically optimise subset size':'Teilmengengröße automatisch optimieren','Kernel':'Kernel','RBF / squared exponential':'RBF / quadratisch-exponentiell','Rational quadratic':'Rational-quadratisch','Linear kernel':'Linearer Kernel','Length scale':'Längenskala','Signal variance':'Signalvarianz','Observation-noise standard deviation':'Standardabweichung des Beobachtungsrauschens','Numerical jitter':'Numerischer Jitter','Kernel optimisation iterations':'Iterationen der Kernel-Optimierung','Rational-quadratic alpha':'Rational-quadratisches Alpha','Representative subset size':'Größe der repräsentativen Teilmenge','Subset selection':'Teilmengenauswahl','Farthest-point sampling':'Farthest-Point-Sampling','K-means++ representative sampling':'Repräsentatives K-means++-Sampling','Random sampling':'Zufallsstichprobe','Automatic subset minimum':'Automatisches Teilmengenminimum','Automatic subset maximum':'Automatisches Teilmengenmaximum','Subset sizes evaluated':'Bewertete Teilmengengrößen','Validation tolerance for smaller subset':'Validierungstoleranz für kleinere Teilmenge',
      'Artificial neural network':'Künstliches neuronales Netz','Hidden layer 1 neurons':'Neuronen in verborgener Schicht 1','Hidden layer 2 neurons':'Neuronen in verborgener Schicht 2','Hidden layer 3 neurons':'Neuronen in verborgener Schicht 3','Activation function':'Aktivierungsfunktion','Optimiser':'Optimierer','Stochastic gradient descent':'Stochastischer Gradientenabstieg','Learning rate':'Lernrate','Batch size':'Batch-Größe','Maximum epochs':'Maximale Epochen','Dropout rate':'Dropout-Rate','L2 regularisation':'L2-Regularisierung','Early-stopping patience':'Early-Stopping-Geduld','Minimum validation improvement':'Minimale Validierungsverbesserung','ANN uncertainty method':'ANN-Unsicherheitsmethode','Monte Carlo dropout':'Monte-Carlo-Dropout','Small deep ensemble':'Kleines Deep-Ensemble','Monte Carlo dropout passes':'Monte-Carlo-Dropout-Durchläufe','Ensemble members':'Ensemble-Mitglieder',
      'Training and optimisation history':'Trainings- und Optimierungsverlauf','Training loss':'Trainingsverlust','Validation loss':'Validierungsverlust','Mean squared loss':'Mittlerer quadratischer Verlust','Epoch':'Epoche','Optimisation iteration':'Optimierungsiteration','Negative log marginal likelihood':'Negative logarithmische Marginal-Likelihood','Maximum tree depth':'Maximale Baumtiefe','Candidate trial':'Kandidatenversuch','Validation RMSE':'Validierungs-RMSE','Native Gaussian-process predictive interval':'Natives GP-Prognoseintervall','Approximate Monte Carlo dropout interval':'Näherungsweises Monte-Carlo-Dropout-Intervall','Approximate neural-network ensemble interval':'Näherungsweises neuronales Ensemble-Intervall'
    }
  };
  const comparisonTranslations = {
    'zh-CN': {
      'Train a comparison set':'训练模型比较组','Train selected baseline models':'训练所选基线模型','No comparison batch is running.':'当前没有运行模型比较批次。','Model comparison workspace':'模型比较工作区','Sort by':'排序依据','Comparable only':'仅显示可比较实验','Validation RMSE':'验证 RMSE','Test RMSE':'测试 RMSE','Test MAE':'测试 MAE','Test R²':'测试 R²','Training time':'训练时间','Actions':'操作','Active':'当前','Preferred':'首选','Different setup':'不同设置','Saved':'已保存','Open':'打开','Prefer':'设为首选','Unmark':'取消首选','Remove':'移除','Download comparison CSV':'下载比较 CSV','Remove non-active experiments':'移除非当前实验','Validation and test RMSE by model':'各模型的验证与测试 RMSE','Fit several baseline models with the same rows, preprocessing, target transformation and uncertainty level. GP and ANN are optional because they can take longer.':'使用相同的数据行、预处理、目标变换和不确定性水平拟合多个基线模型。高斯过程和神经网络耗时可能更长，因此为可选项。'
    },
    'es': {
      'Train a comparison set':'Entrenar un conjunto de comparación','Train selected baseline models':'Entrenar modelos base seleccionados','No comparison batch is running.':'No hay ningún lote de comparación en ejecución.','Model comparison workspace':'Espacio de comparación de modelos','Sort by':'Ordenar por','Comparable only':'Solo comparables','Validation RMSE':'RMSE de validación','Test RMSE':'RMSE de prueba','Test MAE':'MAE de prueba','Test R²':'R² de prueba','Training time':'Tiempo de entrenamiento','Actions':'Acciones','Active':'Activo','Preferred':'Preferido','Different setup':'Configuración diferente','Saved':'Guardado','Open':'Abrir','Prefer':'Preferir','Unmark':'Desmarcar','Remove':'Eliminar','Download comparison CSV':'Descargar CSV de comparación','Remove non-active experiments':'Eliminar experimentos no activos','Validation and test RMSE by model':'RMSE de validación y prueba por modelo','Fit several baseline models with the same rows, preprocessing, target transformation and uncertainty level. GP and ANN are optional because they can take longer.':'Ajusta varios modelos base con las mismas filas, preprocesamiento, transformación del objetivo y nivel de incertidumbre. GP y ANN son opcionales porque pueden tardar más.'
    },
    'fr': {
      'Train a comparison set':'Entraîner un ensemble de comparaison','Train selected baseline models':'Entraîner les modèles de référence sélectionnés','No comparison batch is running.':'Aucun lot de comparaison n’est en cours.','Model comparison workspace':'Espace de comparaison des modèles','Sort by':'Trier par','Comparable only':'Comparables uniquement','Validation RMSE':'RMSE de validation','Test RMSE':'RMSE de test','Test MAE':'MAE de test','Test R²':'R² de test','Training time':'Temps d’entraînement','Actions':'Actions','Active':'Actif','Preferred':'Préféré','Different setup':'Configuration différente','Saved':'Enregistré','Open':'Ouvrir','Prefer':'Préférer','Unmark':'Retirer la préférence','Remove':'Supprimer','Download comparison CSV':'Télécharger le CSV de comparaison','Remove non-active experiments':'Supprimer les expériences non actives','Validation and test RMSE by model':'RMSE de validation et de test par modèle','Fit several baseline models with the same rows, preprocessing, target transformation and uncertainty level. GP and ANN are optional because they can take longer.':'Ajuste plusieurs modèles de référence avec les mêmes lignes, le même prétraitement, la même transformation de cible et le même niveau d’incertitude. GP et ANN sont facultatifs car ils peuvent être plus longs.'
    },
    'de': {
      'Train a comparison set':'Einen Modellvergleich trainieren','Train selected baseline models':'Ausgewählte Basismodelle trainieren','No comparison batch is running.':'Derzeit läuft kein Vergleichslauf.','Model comparison workspace':'Arbeitsbereich für Modellvergleiche','Sort by':'Sortieren nach','Comparable only':'Nur vergleichbare','Validation RMSE':'Validierungs-RMSE','Test RMSE':'Test-RMSE','Test MAE':'Test-MAE','Test R²':'Test-R²','Training time':'Trainingszeit','Actions':'Aktionen','Active':'Aktiv','Preferred':'Bevorzugt','Different setup':'Andere Konfiguration','Saved':'Gespeichert','Open':'Öffnen','Prefer':'Bevorzugen','Unmark':'Markierung entfernen','Remove':'Entfernen','Download comparison CSV':'Vergleichs-CSV herunterladen','Remove non-active experiments':'Nicht aktive Experimente entfernen','Validation and test RMSE by model':'Validierungs- und Test-RMSE nach Modell','Fit several baseline models with the same rows, preprocessing, target transformation and uncertainty level. GP and ANN are optional because they can take longer.':'Mehrere Basismodelle werden mit denselben Zeilen, derselben Vorverarbeitung, Zieltransformation und demselben Unsicherheitsniveau angepasst. GP und ANN sind optional, da sie länger dauern können.'
    }
  };

  for (const [language, entries] of Object.entries(advancedTranslations)) Object.assign(translations[language], entries);
  for (const [language, entries] of Object.entries(comparisonTranslations)) Object.assign(translations[language], entries);

  const originals = new WeakMap();
  const attrOriginals = new WeakMap();

  const validationTranslations = {
    'zh-CN': {'Data-quality assistant':'数据质量助手','Critical':'严重','Warnings':'警告','Information':'信息','Severity':'严重程度','Finding':'发现','Details':'详情','Columns':'列','Recommendation':'建议','Validation and acceptance':'验证与验收','Maximum test RMSE':'最大测试 RMSE','Minimum test R²':'最小测试 R²','Minimum interval coverage':'最小区间覆盖率','Maximum interval coverage':'最大区间覆盖率','Maximum group test RMSE':'最大分组测试 RMSE','Group column':'分组列','No group requirement':'无分组要求','Require no critical data-quality findings':'要求无严重数据质量问题','Evaluate acceptance criteria':'评估验收标准','Download validation summary':'下载验证摘要','Passed':'通过','Failed':'未通过','Not evaluated':'未评估','Prediction applicability':'预测适用性','Within observed ranges':'在观测范围内','Near a boundary':'接近边界','Outside observed domain':'超出观测域','Dropped by preprocessing':'被预处理删除'},
    'es': {'Data-quality assistant':'Asistente de calidad de datos','Critical':'Crítico','Warnings':'Advertencias','Information':'Información','Severity':'Gravedad','Finding':'Hallazgo','Details':'Detalles','Columns':'Columnas','Recommendation':'Recomendación','Validation and acceptance':'Validación y aceptación','Maximum test RMSE':'RMSE máximo de prueba','Minimum test R²':'R² mínimo de prueba','Minimum interval coverage':'Cobertura mínima del intervalo','Maximum interval coverage':'Cobertura máxima del intervalo','Maximum group test RMSE':'RMSE máximo de prueba por grupo','Group column':'Columna de grupo','No group requirement':'Sin requisito de grupo','Require no critical data-quality findings':'Exigir que no haya hallazgos críticos de calidad','Evaluate acceptance criteria':'Evaluar criterios de aceptación','Download validation summary':'Descargar resumen de validación','Passed':'Aprobado','Failed':'Fallido','Not evaluated':'No evaluado','Prediction applicability':'Aplicabilidad de la predicción','Within observed ranges':'Dentro de los rangos observados','Near a boundary':'Cerca de un límite','Outside observed domain':'Fuera del dominio observado','Dropped by preprocessing':'Eliminado por el preprocesamiento'},
    'fr': {'Data-quality assistant':'Assistant de qualité des données','Critical':'Critique','Warnings':'Avertissements','Information':'Information','Severity':'Gravité','Finding':'Constat','Details':'Détails','Columns':'Colonnes','Recommendation':'Recommandation','Validation and acceptance':'Validation et acceptation','Maximum test RMSE':'RMSE de test maximale','Minimum test R²':'R² de test minimal','Minimum interval coverage':'Couverture minimale de l’intervalle','Maximum interval coverage':'Couverture maximale de l’intervalle','Maximum group test RMSE':'RMSE de test maximale par groupe','Group column':'Colonne de groupe','No group requirement':'Aucune exigence de groupe','Require no critical data-quality findings':'Exiger l’absence de constat critique sur les données','Evaluate acceptance criteria':'Évaluer les critères d’acceptation','Download validation summary':'Télécharger le résumé de validation','Passed':'Réussi','Failed':'Échoué','Not evaluated':'Non évalué','Prediction applicability':'Applicabilité de la prédiction','Within observed ranges':'Dans les plages observées','Near a boundary':'Près d’une limite','Outside observed domain':'Hors du domaine observé','Dropped by preprocessing':'Supprimé par le prétraitement'},
    'de': {'Data-quality assistant':'Datenqualitäts-Assistent','Critical':'Kritisch','Warnings':'Warnungen','Information':'Information','Severity':'Schweregrad','Finding':'Befund','Details':'Details','Columns':'Spalten','Recommendation':'Empfehlung','Validation and acceptance':'Validierung und Akzeptanz','Maximum test RMSE':'Maximaler Test-RMSE','Minimum test R²':'Minimales Test-R²','Minimum interval coverage':'Minimale Intervallabdeckung','Maximum interval coverage':'Maximale Intervallabdeckung','Maximum group test RMSE':'Maximaler Gruppen-Test-RMSE','Group column':'Gruppenspalte','No group requirement':'Keine Gruppenanforderung','Require no critical data-quality findings':'Keine kritischen Datenqualitätsbefunde verlangen','Evaluate acceptance criteria':'Akzeptanzkriterien prüfen','Download validation summary':'Validierungszusammenfassung herunterladen','Passed':'Bestanden','Failed':'Fehlgeschlagen','Not evaluated':'Nicht bewertet','Prediction applicability':'Anwendbarkeit der Vorhersage','Within observed ranges':'Innerhalb beobachteter Bereiche','Near a boundary':'Nahe einer Grenze','Outside observed domain':'Außerhalb des beobachteten Bereichs','Dropped by preprocessing':'Durch Vorverarbeitung entfernt'}
  };
  Object.keys(validationTranslations).forEach(language => Object.assign(translations[language], validationTranslations[language]));


  const approvalTranslations = {
    'zh-CN': {'Load approved prediction package':'加载已批准的预测包','Prediction-only mode':'仅预测模式','Return to full workspace':'返回完整工作区','Approval and operational release':'批准与运行发布','Model name':'模型名称','Model owner':'模型负责人','Reviewer / approver':'审核人 / 批准人','Approval status':'批准状态','Draft':'草稿','Approved':'已批准','Approved with conditions':'有条件批准','Rejected':'已拒绝','Retired':'已停用','Decision date':'决定日期','Next review date':'下次审核日期','Intended use':'预期用途','Prohibited or unsupported uses':'禁止或不支持的用途','Known limitations':'已知限制','Approval conditions':'批准条件','Decision notes':'决定备注','Operational input schema':'运行输入架构','Unit':'单位','Description':'说明','Training support':'训练支持范围','Record approval decision':'记录批准决定','Download validation report (HTML)':'下载验证报告（HTML）','Download approved prediction package':'下载已批准的预测包','Approval history':'批准历史','No approved prediction package is loaded. Full-workspace users may still predict with the active fitted model.':'尚未加载已批准的预测包。完整工作区用户仍可使用当前拟合模型进行预测。','Prediction-only':'仅预测','Full workspace':'完整工作区'},
    'es': {'Load approved prediction package':'Cargar paquete de predicción aprobado','Prediction-only mode':'Modo solo predicción','Return to full workspace':'Volver al espacio completo','Approval and operational release':'Aprobación y publicación operativa','Model name':'Nombre del modelo','Model owner':'Responsable del modelo','Reviewer / approver':'Revisor / aprobador','Approval status':'Estado de aprobación','Draft':'Borrador','Approved':'Aprobado','Approved with conditions':'Aprobado con condiciones','Rejected':'Rechazado','Retired':'Retirado','Decision date':'Fecha de decisión','Next review date':'Próxima fecha de revisión','Intended use':'Uso previsto','Prohibited or unsupported uses':'Usos prohibidos o no compatibles','Known limitations':'Limitaciones conocidas','Approval conditions':'Condiciones de aprobación','Decision notes':'Notas de decisión','Operational input schema':'Esquema de entrada operativo','Unit':'Unidad','Description':'Descripción','Training support':'Cobertura de entrenamiento','Record approval decision':'Registrar decisión de aprobación','Download validation report (HTML)':'Descargar informe de validación (HTML)','Download approved prediction package':'Descargar paquete de predicción aprobado','Approval history':'Historial de aprobación','Prediction-only':'Solo predicción','Full workspace':'Espacio completo'},
    'fr': {'Load approved prediction package':'Charger un paquet de prédiction approuvé','Prediction-only mode':'Mode prédiction uniquement','Return to full workspace':'Revenir à l’espace complet','Approval and operational release':'Approbation et mise en service','Model name':'Nom du modèle','Model owner':'Responsable du modèle','Reviewer / approver':'Réviseur / approbateur','Approval status':'Statut d’approbation','Draft':'Brouillon','Approved':'Approuvé','Approved with conditions':'Approuvé sous conditions','Rejected':'Rejeté','Retired':'Retiré','Decision date':'Date de décision','Next review date':'Prochaine date de révision','Intended use':'Usage prévu','Prohibited or unsupported uses':'Usages interdits ou non pris en charge','Known limitations':'Limites connues','Approval conditions':'Conditions d’approbation','Decision notes':'Notes de décision','Operational input schema':'Schéma d’entrée opérationnel','Unit':'Unité','Description':'Description','Training support':'Domaine d’entraînement','Record approval decision':'Enregistrer la décision d’approbation','Download validation report (HTML)':'Télécharger le rapport de validation (HTML)','Download approved prediction package':'Télécharger le paquet de prédiction approuvé','Approval history':'Historique des approbations','Prediction-only':'Prédiction uniquement','Full workspace':'Espace complet'},
    'de': {'Load approved prediction package':'Genehmigtes Prognosepaket laden','Prediction-only mode':'Nur-Prognose-Modus','Return to full workspace':'Zum vollständigen Arbeitsbereich zurückkehren','Approval and operational release':'Genehmigung und operativer Einsatz','Model name':'Modellname','Model owner':'Modellverantwortliche Person','Reviewer / approver':'Prüfer / Genehmiger','Approval status':'Genehmigungsstatus','Draft':'Entwurf','Approved':'Genehmigt','Approved with conditions':'Mit Auflagen genehmigt','Rejected':'Abgelehnt','Retired':'Außer Betrieb','Decision date':'Entscheidungsdatum','Next review date':'Nächster Prüftermin','Intended use':'Vorgesehene Verwendung','Prohibited or unsupported uses':'Verbotene oder nicht unterstützte Verwendungen','Known limitations':'Bekannte Einschränkungen','Approval conditions':'Genehmigungsauflagen','Decision notes':'Entscheidungsnotizen','Operational input schema':'Operatives Eingabeschema','Unit':'Einheit','Description':'Beschreibung','Training support':'Trainingsbereich','Record approval decision':'Genehmigungsentscheidung erfassen','Download validation report (HTML)':'Validierungsbericht herunterladen (HTML)','Download approved prediction package':'Genehmigtes Prognosepaket herunterladen','Approval history':'Genehmigungsverlauf','Prediction-only':'Nur Prognose','Full workspace':'Vollständiger Arbeitsbereich'}
  };
  Object.keys(approvalTranslations).forEach(language => Object.assign(translations[language], approvalTranslations[language]));

  const expandedModelTranslations = {
    'zh-CN': {
      'Elastic net':'弹性网络回归','Combined L1 and L2 shrinkage for sparse, correlated linear models.':'结合 L1 和 L2 收缩，适用于稀疏且相关的线性特征。',
      'Huber robust regression':'Huber 稳健回归','Downweights large residuals to reduce outlier influence.':'降低大残差的权重，以减少异常值影响。',
      'Gradient-boosted trees':'梯度提升树','Sequential shallow trees for strong nonlinear tabular prediction.':'通过顺序浅层树实现强大的非线性表格预测。',
      'k-nearest neighbours':'k 近邻回归','Local prediction from similar processed training rows.':'根据相似的已处理训练行进行局部预测。',
      'Linear quantile regression':'线性分位数回归','Predicts a conditional quantile and fitted lower/upper quantile bounds.':'预测条件分位数及拟合的上下分位数边界。',
      'Overall penalty (lambda)':'总惩罚强度（lambda）','L1 mixing ratio':'L1 混合比例','Maximum coordinate-descent iterations':'坐标下降最大迭代次数','Convergence tolerance':'收敛容差',
      'Huber threshold':'Huber 阈值','Maximum IRLS iterations':'IRLS 最大迭代次数','Numerical ridge stabiliser':'数值岭稳定项',
      'Boosting stages':'提升阶段数','Boosting learning rate':'提升学习率','Tree depth per stage':'每阶段树深度','Row subsampling fraction':'行子采样比例',
      'Number of neighbours':'近邻数量','Neighbour weighting':'近邻加权','Uniform weighting':'均匀加权','Inverse-distance weighting':'距离倒数加权','Distance metric power':'距离度量幂次','Maximum stored training rows':'最大存储训练行数',
      'Central quantile':'中心分位数','Iterations per fitted quantile':'每个拟合分位数的迭代次数','Optimisation learning rate':'优化学习率'
    },
    'es': {
      'Elastic net':'Red elástica','Combined L1 and L2 shrinkage for sparse, correlated linear models.':'Combina contracción L1 y L2 para modelos lineales dispersos y correlacionados.',
      'Huber robust regression':'Regresión robusta de Huber','Downweights large residuals to reduce outlier influence.':'Reduce el peso de residuos grandes para limitar la influencia de valores atípicos.',
      'Gradient-boosted trees':'Árboles con refuerzo de gradiente','Sequential shallow trees for strong nonlinear tabular prediction.':'Árboles poco profundos secuenciales para predicción tabular no lineal.',
      'k-nearest neighbours':'k vecinos más cercanos','Local prediction from similar processed training rows.':'Predicción local a partir de filas de entrenamiento procesadas similares.',
      'Linear quantile regression':'Regresión cuantílica lineal','Predicts a conditional quantile and fitted lower/upper quantile bounds.':'Predice un cuantil condicional y límites cuantílicos inferior/superior.',
      'Overall penalty (lambda)':'Penalización total (lambda)','L1 mixing ratio':'Proporción de mezcla L1','Maximum coordinate-descent iterations':'Máximo de iteraciones de descenso por coordenadas','Convergence tolerance':'Tolerancia de convergencia',
      'Huber threshold':'Umbral de Huber','Maximum IRLS iterations':'Máximo de iteraciones IRLS','Numerical ridge stabiliser':'Estabilizador ridge numérico',
      'Boosting stages':'Etapas de refuerzo','Boosting learning rate':'Tasa de aprendizaje del refuerzo','Tree depth per stage':'Profundidad por etapa','Row subsampling fraction':'Fracción de submuestreo de filas',
      'Number of neighbours':'Número de vecinos','Neighbour weighting':'Ponderación de vecinos','Uniform weighting':'Ponderación uniforme','Inverse-distance weighting':'Ponderación por distancia inversa','Distance metric power':'Potencia de la métrica de distancia','Maximum stored training rows':'Máximo de filas de entrenamiento almacenadas',
      'Central quantile':'Cuantil central','Iterations per fitted quantile':'Iteraciones por cuantil ajustado','Optimisation learning rate':'Tasa de aprendizaje de optimización'
    },
    'fr': {
      'Elastic net':'Régression elastic net','Combined L1 and L2 shrinkage for sparse, correlated linear models.':'Combine les pénalisations L1 et L2 pour les modèles linéaires parcimonieux et corrélés.',
      'Huber robust regression':'Régression robuste de Huber','Downweights large residuals to reduce outlier influence.':'Réduit le poids des grands résidus pour limiter l’influence des valeurs aberrantes.',
      'Gradient-boosted trees':'Arbres à gradient boosting','Sequential shallow trees for strong nonlinear tabular prediction.':'Arbres peu profonds séquentiels pour une prédiction tabulaire non linéaire.',
      'k-nearest neighbours':'k plus proches voisins','Local prediction from similar processed training rows.':'Prédiction locale à partir de lignes d’entraînement traitées similaires.',
      'Linear quantile regression':'Régression quantile linéaire','Predicts a conditional quantile and fitted lower/upper quantile bounds.':'Prédit un quantile conditionnel et des bornes quantiles inférieure/supérieure.',
      'Overall penalty (lambda)':'Pénalité globale (lambda)','L1 mixing ratio':'Ratio de mélange L1','Maximum coordinate-descent iterations':'Itérations maximales de descente par coordonnées','Convergence tolerance':'Tolérance de convergence',
      'Huber threshold':'Seuil de Huber','Maximum IRLS iterations':'Itérations IRLS maximales','Numerical ridge stabiliser':'Stabilisateur ridge numérique',
      'Boosting stages':'Étapes de boosting','Boosting learning rate':'Taux d’apprentissage du boosting','Tree depth per stage':'Profondeur d’arbre par étape','Row subsampling fraction':'Fraction de sous-échantillonnage des lignes',
      'Number of neighbours':'Nombre de voisins','Neighbour weighting':'Pondération des voisins','Uniform weighting':'Pondération uniforme','Inverse-distance weighting':'Pondération inverse de la distance','Distance metric power':'Puissance de la métrique de distance','Maximum stored training rows':'Nombre maximal de lignes stockées',
      'Central quantile':'Quantile central','Iterations per fitted quantile':'Itérations par quantile ajusté','Optimisation learning rate':'Taux d’apprentissage de l’optimisation'
    },
    'de': {
      'Elastic net':'Elastic-Net-Regression','Combined L1 and L2 shrinkage for sparse, correlated linear models.':'Kombiniert L1- und L2-Schrumpfung für dünn besetzte, korrelierte lineare Modelle.',
      'Huber robust regression':'Robuste Huber-Regression','Downweights large residuals to reduce outlier influence.':'Gewichtet große Residuen geringer, um den Einfluss von Ausreißern zu reduzieren.',
      'Gradient-boosted trees':'Gradientenverstärkte Bäume','Sequential shallow trees for strong nonlinear tabular prediction.':'Sequenzielle flache Bäume für starke nichtlineare Tabellenvorhersagen.',
      'k-nearest neighbours':'k-nächste Nachbarn','Local prediction from similar processed training rows.':'Lokale Vorhersage aus ähnlichen verarbeiteten Trainingszeilen.',
      'Linear quantile regression':'Lineare Quantilsregression','Predicts a conditional quantile and fitted lower/upper quantile bounds.':'Sagt ein bedingtes Quantil und angepasste untere/obere Quantilgrenzen voraus.',
      'Overall penalty (lambda)':'Gesamtstrafe (Lambda)','L1 mixing ratio':'L1-Mischungsverhältnis','Maximum coordinate-descent iterations':'Maximale Koordinatenabstiegs-Iterationen','Convergence tolerance':'Konvergenztoleranz',
      'Huber threshold':'Huber-Schwellenwert','Maximum IRLS iterations':'Maximale IRLS-Iterationen','Numerical ridge stabiliser':'Numerischer Ridge-Stabilisator',
      'Boosting stages':'Boosting-Stufen','Boosting learning rate':'Boosting-Lernrate','Tree depth per stage':'Baumtiefe je Stufe','Row subsampling fraction':'Zeilen-Unterabtastungsanteil',
      'Number of neighbours':'Anzahl der Nachbarn','Neighbour weighting':'Nachbargewichtung','Uniform weighting':'Gleichmäßige Gewichtung','Inverse-distance weighting':'Inverse Distanzgewichtung','Distance metric power':'Potenz der Distanzmetrik','Maximum stored training rows':'Maximal gespeicherte Trainingszeilen',
      'Central quantile':'Zentrales Quantil','Iterations per fitted quantile':'Iterationen je angepasstes Quantil','Optimisation learning rate':'Optimierungs-Lernrate'
    }
  };
  Object.keys(expandedModelTranslations).forEach(language => Object.assign(translations[language], expandedModelTranslations[language]));


  const workspaceTranslationsV1011 = {
    "zh-CN": {
        "Local Regression Studio": "本地回归工作室",
        "Prepare, compare, validate, approve, operate and monitor regression models locally with versioned governance records.": "在本地准备、比较、验证、批准、运行和监控回归模型，并保留版本化治理记录。",
        "Predict": "预测",
        "Monitor": "监控",
        "System": "系统",
        "Runtime and integrity": "运行环境与完整性",
        "Recovery": "恢复",
        "Help": "帮助",
        "User guide": "用户指南",
        "Step 4 model options": "第 4 步模型选项",
        "Validation and applicability": "验证与适用性",
        "Approval and operation": "批准与运行",
        "Security and privacy": "安全与隐私",
        "Step 1": "第 1 步",
        "Step 2": "第 2 步",
        "Step 3": "第 3 步",
        "Step 4": "第 4 步",
        "Step 5": "第 5 步",
        "Step 6": "第 6 步",
        "Step 7": "第 7 步",
        "Step 8": "第 8 步",
        "CSV": "CSV",
        "Load approved prediction package": "加载已批准预测包",
        "Prediction-only mode": "仅预测模式",
        "Box–Cox": "Box–Cox",
        "Yeo–Johnson": "Yeo–Johnson",
        "Data-quality assistant": "数据质量助手",
        "Automated checks update with the selected target and features. They identify common risks but do not replace scientific or domain review.": "自动检查会随所选目标和特征更新。它们识别常见风险，但不能替代科学或领域审查。",
        "Load a CSV to run data-quality checks.": "加载 CSV 以运行数据质量检查。",
        "Regression only:": "仅支持回归：",
        "these models predict a continuous numeric target. Classification targets are not supported in this release.": "这些模型预测连续数值目标。本版本不支持分类目标。",
        "Exact or representative-subset GP with native predictive uncertainty.": "精确或代表性子集高斯过程，并提供原生预测不确定性。",
        "Feed-forward dense network with early stopping and approximate uncertainty.": "前馈全连接网络，带早停和近似不确定性。",
        "Compare several baseline models": "比较多个基线模型",
        "Single-model training is the default. Open the comparison tools only when you want a quick baseline comparison across multiple model families.": "默认进行单模型训练。只有需要快速比较多个模型族时才打开比较工具。",
        "Show comparison tools": "显示比较工具",
        "Shared-split rule:": "共享划分规则：",
        "quick baseline comparison freezes the current target, selected features, preprocessing, target transformation, uncertainty level, random seed, and exact train/validation/test rows, then trains each selected model once using documented baseline settings.": "快速基线比较会固定当前目标、所选特征、预处理、目标变换、不确定性水平、随机种子以及精确的训练/验证/测试行，然后使用文档化的基线设置训练每个所选模型一次。",
        "Show baseline comparison settings": "显示基线比较设置",
        "These presets are not the same as full Step 4 tuning. They are quick, documented starting configurations used to compare model families on one frozen split. To tune a model, use Step 4 and train it separately; tuned comparison remains a later workflow.": "这些预设不同于完整的第 4 步调参。它们是在同一固定划分上比较模型族的快速、文档化起始配置。如需调参，请在第 4 步设置并单独训练；调参式比较留待后续工作流。",
        "Baseline settings used in comparison": "比较中使用的基线设置",
        "Speed note": "速度说明",
        "Ordinary linear regression, no model-specific hyperparameters.": "普通线性回归，无模型专属超参数。",
        "Fast baseline.": "快速基线。",
        "Fast; useful with correlated features.": "速度快；适合相关特征。",
        "Moderate; can shrink unhelpful features.": "中等速度；可收缩无用特征。",
        "Moderate; downweights large residuals.": "中等速度；降低大残差权重。",
        "Fast nonlinear baseline.": "快速非线性基线。",
        "Moderate; strong general tabular baseline.": "中等速度；强通用表格基线。",
        "Moderate to slow; sequential tree ensemble.": "中等到较慢；顺序树集成。",
        "Fast fit; prediction can be heavier on large data.": "拟合很快；大数据预测可能较重。",
        "Moderate; interval behaviour differs from residual intervals.": "中等速度；区间行为不同于残差区间。",
        "Can be slow; native uncertainty.": "可能较慢；原生不确定性。",
        "Can be slow and iterative.": "可能较慢且迭代。",
        "Fast baseline": "快速基线",
        "L2 regularised linear": "L2 正则线性",
        "L1 + L2 regularisation": "L1 + L2 正则化",
        "Outlier-resistant linear": "抗异常值线性",
        "Nonlinear rules": "非线性规则",
        "Nonlinear ensemble": "非线性集成",
        "Sequential tree ensemble": "顺序树集成",
        "Local similarity model": "局部相似模型",
        "Conditional median and bounds": "条件中位数和边界",
        "Slower; native uncertainty": "较慢；原生不确定性",
        "Slower; iterative training": "较慢；迭代训练",
        "Train selected baseline models": "训练所选基线模型",
        "No comparison batch is running.": "没有正在运行的比较批次。",
        "Review, validate, approve, and export": "审查、验证、批准并导出",
        "Model comparison workspace": "模型比较工作区",
        "Experiments marked comparable use the same dataset fingerprint, target, features, preprocessing, split membership, target transformation and interval level.": "标记为可比较的实验使用相同的数据集指纹、目标、特征、预处理、划分成员、目标变换和区间水平。",
        "Sort by": "排序依据",
        "Test MAE": "测试 MAE",
        "Test R²": "测试 R²",
        "Training time": "训练时间",
        "Chart metric": "图表指标",
        "Interval coverage": "区间覆盖率",
        "Chart scope": "图表范围",
        "Comparable experiments only": "仅可比较实验",
        "All experiments, labelled": "所有实验，并标注",
        "Table comparable only": "表格仅显示可比较项",
        "Download comparison CSV": "下载比较 CSV",
        "Remove non-active experiments": "删除非活动实验",
        "Selected comparison metric by model": "按模型显示所选比较指标",
        "Actual and predicted vs input feature": "实际值和预测值与输入特征",
        "Training and optimisation history": "训练与优化历史",
        "Validation and acceptance": "验证与接受",
        "Acceptance criteria apply to the currently active experiment unless you explicitly apply them to all comparable experiments. Blank numeric fields are not evaluated. Acceptance is a user decision, not an automatic certification.": "除非明确应用于所有可比较实验，否则接受标准只应用于当前活动实验。空白数值字段不会被评估。接受是用户决策，不是自动认证。",
        "Maximum test RMSE": "最大测试 RMSE",
        "Minimum test R²": "最小测试 R²",
        "Minimum interval coverage": "最小区间覆盖率",
        "Maximum interval coverage": "最大区间覆盖率",
        "Maximum group test RMSE": "最大分组测试 RMSE",
        "Group column": "分组列",
        "No group requirement": "无分组要求",
        "Require no critical data-quality findings": "要求无关键数据质量发现",
        "Critical findings are based on the currently selected target and features.": "关键发现基于当前所选目标和特征。",
        "Evaluate active model": "评估活动模型",
        "Apply criteria to all comparable models": "将标准应用于所有可比较模型",
        "Download validation summary": "下载验证摘要",
        "Train or load a model to evaluate acceptance criteria.": "训练或加载模型以评估接受标准。",
        "Test performance by selected group": "按所选分组显示测试性能",
        "Approval and operational release": "批准与运行发布",
        "Record a human decision, document intended and prohibited uses, define the operational input schema, and export an integrity-checked prediction package.": "记录人工决策，说明预期和禁止用途，定义运行输入模式，并导出经过完整性检查的预测包。",
        "Model selected for approval": "选择用于批准的模型",
        "Approval decisions apply to this explicit release candidate. Final approval records, history, and approved-package exports are available in Final reports and exports below. The selector defaults to the preferred experiment when one is marked; otherwise it uses the active experiment.": "批准决策应用于这个明确的发布候选模型。最终批准记录、历史和已批准包导出位于下方“最终报告和导出”。若已标记首选实验，选择器默认使用它；否则使用活动实验。",
        "Approval candidate": "批准候选模型",
        "No fitted experiment available": "没有可用的已拟合实验",
        "Open selected model for review": "打开所选模型进行审查",
        "Train or open a model to choose an approval candidate.": "训练或打开模型以选择批准候选。",
        "Model name": "模型名称",
        "Model developer": "模型开发者",
        "Model owner": "模型所有者",
        "Independent reviewer": "独立审查员",
        "Approver": "批准人",
        "Recorded role": "记录角色",
        "Developer": "开发者",
        "Owner": "所有者",
        "Reviewer": "审查员",
        "Administrator": "管理员",
        "Approval status": "批准状态",
        "Draft": "草稿",
        "Under review": "审查中",
        "Validation failed": "验证失败",
        "Approved": "已批准",
        "Approved with conditions": "有条件批准",
        "Suspended": "暂停",
        "Expired": "已过期",
        "Rejected": "已拒绝",
        "Retired": "已退役",
        "Decision date": "决策日期",
        "Next review date": "下次审查日期",
        "Intended use": "预期用途",
        "Prohibited or unsupported uses": "禁止或不支持的用途",
        "Known limitations": "已知限制",
        "Approval conditions": "批准条件",
        "Decision notes": "决策备注",
        "Operational input schema": "运行输入模式",
        "Training-derived ranges and category levels are locked. Optional units and descriptions are saved with approved prediction packages.": "训练得到的范围和类别水平会被锁定。可选单位和说明会随已批准预测包保存。",
        "Record approval decision": "记录批准决策",
        "Train or load a model to record an approval decision.": "训练或加载模型以记录批准决策。",
        "Approval history": "批准历史",
        "Final reports and exports": "最终报告和导出",
        "Download validation evidence, approval records, operational packages, model artifacts, metrics and plots after completing diagnostics, acceptance review and approval decisions.": "完成诊断、接受审查和批准决策后，下载验证证据、批准记录、运行包、模型工件、指标和图表。",
        "Figures to embed in the validation report": "嵌入验证报告的图形",
        "Actual and predicted vs selected feature": "实际值和预测值与所选特征",
        "Q–Q plot": "Q–Q 图",
        "Model-comparison chart": "模型比较图",
        "Validation and governance reports": "验证与治理报告",
        "Download validation report (HTML)": "下载验证报告（HTML）",
        "Download governance report (JSON)": "下载治理报告（JSON）",
        "Download approval record": "下载批准记录",
        "Download approval history CSV": "下载批准历史 CSV",
        "Model, project and result exports": "模型、项目和结果导出",
        "Download experiment record": "下载实验记录",
        "Operational release": "运行发布",
        "Download approved prediction package": "下载已批准预测包",
        "The approved prediction package is enabled only when the selected approval candidate has an approved or conditionally approved status.": "只有当所选批准候选模型处于已批准或有条件批准状态时，才启用已批准预测包。",
        "Full workspace": "完整工作区",
        "No approved prediction package is loaded. Full-workspace users may still predict with the active fitted model.": "未加载已批准预测包。完整工作区用户仍可使用活动拟合模型进行预测。",
        "Include original input features in export": "导出中包含原始输入特征",
        "Monitor operational performance and revalidation": "监控运行性能和再验证",
        "Import a CSV containing previous predictions and later measured outcomes. Monitoring does not retrain or alter the model.": "导入包含历史预测和后续实测结果的 CSV。监控不会重新训练或更改模型。",
        "Upload monitoring CSV": "上传监控 CSV",
        "Download monitoring record": "下载监控记录",
        "Predicted target column": "预测目标列",
        "Lower interval column": "区间下界列",
        "Upper interval column": "区间上界列",
        "Optional group column": "可选分组列",
        "Optional date column": "可选日期列",
        "No dates": "无日期",
        "Applicability-status column": "适用性状态列",
        "Analyse monitoring data": "分析监控数据",
        "Monitoring CSV formats:": "监控 CSV 格式：",
        "a minimal file needs measured and predicted target columns. Extended monitoring should also include original input features, package ID, row/sample ID, prediction date, applicability status, and source/regime columns so you can investigate drift and failures.": "最小文件需要实测目标列和预测目标列。扩展监控还应包含原始输入特征、包 ID、行/样本 ID、预测日期、适用性状态以及来源/工况列，以便调查漂移和失败。",
        "Upload an operational-results CSV to calculate performance after deployment.": "上传运行结果 CSV 以计算部署后的性能。",
        "Revalidation triggers": "再验证触发条件",
        "Maximum monitoring RMSE": "最大监控 RMSE",
        "Maximum absolute bias": "最大绝对偏差",
        "Maximum warning/outside rate": "最大警告/越界率",
        "Required review date": "要求审查日期",
        "Evaluate revalidation triggers": "评估再验证触发条件",
        "No monitoring record has been analysed.": "尚未分析监控记录。",
        "Model-change assessment": "模型变更评估",
        "Compare the active experiment with another saved experiment before replacement or reapproval.": "在替换或重新批准前，将活动实验与另一个已保存实验比较。",
        "Reference experiment": "参考实验",
        "Choose saved experiment…": "选择已保存实验…",
        "Compare models": "比较模型",
        "Download assessment": "下载评估",
        "Save at least two experiments in the project to compare a proposed replacement.": "项目中至少保存两个实验，才能比较拟替代模型。",
        "Build and runtime integrity": "构建与运行完整性",
        "Checking the application edition and dependency sources…": "正在检查应用版本和依赖来源…",
        "Download runtime manifest": "下载运行清单",
        "Local recovery": "本地恢复",
        "No recovery snapshot was found.": "未找到恢复快照。",
        "Restore snapshot": "恢复快照",
        "Discard snapshot": "丢弃快照",
        "Recovery snapshots exclude the original training CSV. They may contain fitted models and derived results.": "恢复快照不包含原始训练 CSV。它们可能包含已拟合模型和派生结果。",
        "What the data-quality assistant checks": "数据质量助手检查什么",
        "Severity:": "严重程度："
    },
    "es": {
        "Local Regression Studio": "Local Regression Studio",
        "Prepare, compare, validate, approve, operate and monitor regression models locally with versioned governance records.": "Prepare, compare, valide, apruebe, opere y supervise modelos de regresión localmente con registros de gobernanza versionados.",
        "Predict": "Predecir",
        "Monitor": "Supervisar",
        "System": "Sistema",
        "Runtime and integrity": "Ejecución e integridad",
        "Recovery": "Recuperación",
        "Help": "Ayuda",
        "User guide": "Guía de usuario",
        "Step 4 model options": "Opciones de modelo del paso 4",
        "Validation and applicability": "Validación y aplicabilidad",
        "Approval and operation": "Aprobación y operación",
        "Security and privacy": "Seguridad y privacidad",
        "Step 1": "Paso 1",
        "Step 2": "Paso 2",
        "Step 3": "Paso 3",
        "Step 4": "Paso 4",
        "Step 5": "Paso 5",
        "Step 6": "Paso 6",
        "Step 7": "Paso 7",
        "Step 8": "Paso 8",
        "Load approved prediction package": "Cargar paquete de predicción aprobado",
        "Prediction-only mode": "Modo solo predicción",
        "Data-quality assistant": "Asistente de calidad de datos",
        "Regression only:": "Solo regresión:",
        "these models predict a continuous numeric target. Classification targets are not supported in this release.": "estos modelos predicen un objetivo numérico continuo. Los objetivos de clasificación no son compatibles en esta versión.",
        "Compare several baseline models": "Comparar varios modelos base",
        "Show comparison tools": "Mostrar herramientas de comparación",
        "Shared-split rule:": "Regla de división compartida:",
        "Show baseline comparison settings": "Mostrar configuración de comparación base",
        "Baseline settings used in comparison": "Configuración base usada en la comparación",
        "Speed note": "Nota de velocidad",
        "Train selected baseline models": "Entrenar modelos base seleccionados",
        "No comparison batch is running.": "No hay ningún lote de comparación en ejecución.",
        "Review, validate, approve, and export": "Revisar, validar, aprobar y exportar",
        "Model comparison workspace": "Área de comparación de modelos",
        "Sort by": "Ordenar por",
        "Training time": "Tiempo de entrenamiento",
        "Chart metric": "Métrica del gráfico",
        "Chart scope": "Alcance del gráfico",
        "Comparable experiments only": "Solo experimentos comparables",
        "All experiments, labelled": "Todos los experimentos, etiquetados",
        "Table comparable only": "Tabla solo comparables",
        "Download comparison CSV": "Descargar CSV de comparación",
        "Remove non-active experiments": "Eliminar experimentos no activos",
        "Selected comparison metric by model": "Métrica de comparación seleccionada por modelo",
        "Actual and predicted vs input feature": "Real y predicho frente a variable de entrada",
        "Training and optimisation history": "Historial de entrenamiento y optimización",
        "Validation and acceptance": "Validación y aceptación",
        "Evaluate active model": "Evaluar modelo activo",
        "Apply criteria to all comparable models": "Aplicar criterios a todos los modelos comparables",
        "Download validation summary": "Descargar resumen de validación",
        "Test performance by selected group": "Rendimiento de prueba por grupo seleccionado",
        "Approval and operational release": "Aprobación y liberación operativa",
        "Model selected for approval": "Modelo seleccionado para aprobación",
        "Approval candidate": "Candidato de aprobación",
        "No fitted experiment available": "No hay experimento ajustado disponible",
        "Open selected model for review": "Abrir modelo seleccionado para revisión",
        "Model name": "Nombre del modelo",
        "Model developer": "Desarrollador del modelo",
        "Model owner": "Propietario del modelo",
        "Independent reviewer": "Revisor independiente",
        "Approver": "Aprobador",
        "Recorded role": "Rol registrado",
        "Developer": "Desarrollador",
        "Owner": "Propietario",
        "Reviewer": "Revisor",
        "Administrator": "Administrador",
        "Approval status": "Estado de aprobación",
        "Draft": "Borrador",
        "Under review": "En revisión",
        "Validation failed": "Validación fallida",
        "Approved": "Aprobado",
        "Approved with conditions": "Aprobado con condiciones",
        "Suspended": "Suspendido",
        "Expired": "Caducado",
        "Rejected": "Rechazado",
        "Retired": "Retirado",
        "Decision date": "Fecha de decisión",
        "Next review date": "Próxima fecha de revisión",
        "Intended use": "Uso previsto",
        "Prohibited or unsupported uses": "Usos prohibidos o no admitidos",
        "Known limitations": "Limitaciones conocidas",
        "Approval conditions": "Condiciones de aprobación",
        "Decision notes": "Notas de decisión",
        "Operational input schema": "Esquema de entrada operativo",
        "Record approval decision": "Registrar decisión de aprobación",
        "Approval history": "Historial de aprobación",
        "Final reports and exports": "Informes finales y exportaciones",
        "Figures to embed in the validation report": "Figuras para incluir en el informe de validación",
        "Validation and governance reports": "Informes de validación y gobernanza",
        "Download validation report (HTML)": "Descargar informe de validación (HTML)",
        "Download governance report (JSON)": "Descargar informe de gobernanza (JSON)",
        "Download approval record": "Descargar registro de aprobación",
        "Download approval history CSV": "Descargar historial de aprobación CSV",
        "Model, project and result exports": "Exportaciones de modelo, proyecto y resultados",
        "Download experiment record": "Descargar registro de experimento",
        "Operational release": "Liberación operativa",
        "Download approved prediction package": "Descargar paquete de predicción aprobado",
        "Full workspace": "Área completa",
        "Include original input features in export": "Incluir variables de entrada originales en la exportación",
        "Monitor operational performance and revalidation": "Supervisar rendimiento operativo y revalidación",
        "Upload monitoring CSV": "Cargar CSV de supervisión",
        "Download monitoring record": "Descargar registro de supervisión",
        "Predicted target column": "Columna de objetivo predicho",
        "Lower interval column": "Columna de límite inferior",
        "Upper interval column": "Columna de límite superior",
        "Optional group column": "Columna de grupo opcional",
        "Optional date column": "Columna de fecha opcional",
        "Applicability-status column": "Columna de estado de aplicabilidad",
        "Analyse monitoring data": "Analizar datos de supervisión",
        "Monitoring CSV formats:": "Formatos CSV de supervisión:",
        "Revalidation triggers": "Disparadores de revalidación",
        "Maximum monitoring RMSE": "RMSE máximo de supervisión",
        "Maximum absolute bias": "Sesgo absoluto máximo",
        "Maximum warning/outside rate": "Tasa máxima de advertencias/fuera de rango",
        "Required review date": "Fecha de revisión requerida",
        "Evaluate revalidation triggers": "Evaluar disparadores de revalidación",
        "Model-change assessment": "Evaluación de cambio de modelo",
        "Reference experiment": "Experimento de referencia",
        "Choose saved experiment…": "Elegir experimento guardado…",
        "Compare models": "Comparar modelos",
        "Download assessment": "Descargar evaluación",
        "Build and runtime integrity": "Integridad de compilación y ejecución",
        "Download runtime manifest": "Descargar manifiesto de ejecución",
        "Local recovery": "Recuperación local",
        "Restore snapshot": "Restaurar instantánea",
        "Discard snapshot": "Descartar instantánea",
        "What the data-quality assistant checks": "Qué comprueba el asistente de calidad de datos",
        "Severity:": "Severidad:"
    },
    "fr": {
        "Prepare, compare, validate, approve, operate and monitor regression models locally with versioned governance records.": "Préparer, comparer, valider, approuver, exploiter et surveiller des modèles de régression localement avec des enregistrements de gouvernance versionnés.",
        "Predict": "Prédire",
        "Monitor": "Surveiller",
        "System": "Système",
        "Runtime and integrity": "Exécution et intégrité",
        "Recovery": "Récupération",
        "Help": "Aide",
        "User guide": "Guide utilisateur",
        "Step 4 model options": "Options de modèle de l’étape 4",
        "Validation and applicability": "Validation et applicabilité",
        "Approval and operation": "Approbation et exploitation",
        "Security and privacy": "Sécurité et confidentialité",
        "Step 1": "Étape 1",
        "Step 2": "Étape 2",
        "Step 3": "Étape 3",
        "Step 4": "Étape 4",
        "Step 5": "Étape 5",
        "Step 6": "Étape 6",
        "Step 7": "Étape 7",
        "Step 8": "Étape 8",
        "Load approved prediction package": "Charger un paquet de prédiction approuvé",
        "Prediction-only mode": "Mode prédiction seule",
        "Data-quality assistant": "Assistant qualité des données",
        "Regression only:": "Régression uniquement :",
        "these models predict a continuous numeric target. Classification targets are not supported in this release.": "ces modèles prédisent une cible numérique continue. Les cibles de classification ne sont pas prises en charge dans cette version.",
        "Compare several baseline models": "Comparer plusieurs modèles de référence",
        "Show comparison tools": "Afficher les outils de comparaison",
        "Shared-split rule:": "Règle de partition partagée :",
        "Show baseline comparison settings": "Afficher les paramètres de comparaison de référence",
        "Baseline settings used in comparison": "Paramètres de référence utilisés pour la comparaison",
        "Speed note": "Note de vitesse",
        "Train selected baseline models": "Entraîner les modèles de référence sélectionnés",
        "No comparison batch is running.": "Aucun lot de comparaison n’est en cours.",
        "Review, validate, approve, and export": "Examiner, valider, approuver et exporter",
        "Model comparison workspace": "Espace de comparaison des modèles",
        "Sort by": "Trier par",
        "Training time": "Temps d’entraînement",
        "Chart metric": "Métrique du graphique",
        "Chart scope": "Portée du graphique",
        "Comparable experiments only": "Expériences comparables uniquement",
        "All experiments, labelled": "Toutes les expériences, étiquetées",
        "Table comparable only": "Tableau comparable uniquement",
        "Download comparison CSV": "Télécharger le CSV de comparaison",
        "Remove non-active experiments": "Supprimer les expériences non actives",
        "Selected comparison metric by model": "Métrique de comparaison sélectionnée par modèle",
        "Actual and predicted vs input feature": "Valeur réelle et prédite selon la variable d’entrée",
        "Training and optimisation history": "Historique d’entraînement et d’optimisation",
        "Validation and acceptance": "Validation et acceptation",
        "Evaluate active model": "Évaluer le modèle actif",
        "Apply criteria to all comparable models": "Appliquer les critères à tous les modèles comparables",
        "Download validation summary": "Télécharger le résumé de validation",
        "Test performance by selected group": "Performance de test par groupe sélectionné",
        "Approval and operational release": "Approbation et mise en exploitation",
        "Model selected for approval": "Modèle sélectionné pour approbation",
        "Approval candidate": "Candidat à l’approbation",
        "No fitted experiment available": "Aucune expérience ajustée disponible",
        "Open selected model for review": "Ouvrir le modèle sélectionné pour examen",
        "Model name": "Nom du modèle",
        "Model developer": "Développeur du modèle",
        "Model owner": "Propriétaire du modèle",
        "Independent reviewer": "Examinateur indépendant",
        "Approver": "Approbateur",
        "Recorded role": "Rôle enregistré",
        "Developer": "Développeur",
        "Owner": "Propriétaire",
        "Reviewer": "Examinateur",
        "Administrator": "Administrateur",
        "Approval status": "Statut d’approbation",
        "Draft": "Brouillon",
        "Under review": "En cours d’examen",
        "Validation failed": "Validation échouée",
        "Approved": "Approuvé",
        "Approved with conditions": "Approuvé avec conditions",
        "Suspended": "Suspendu",
        "Expired": "Expiré",
        "Rejected": "Rejeté",
        "Retired": "Retiré",
        "Decision date": "Date de décision",
        "Next review date": "Prochaine date d’examen",
        "Intended use": "Utilisation prévue",
        "Prohibited or unsupported uses": "Utilisations interdites ou non prises en charge",
        "Known limitations": "Limitations connues",
        "Approval conditions": "Conditions d’approbation",
        "Decision notes": "Notes de décision",
        "Operational input schema": "Schéma d’entrée opérationnel",
        "Record approval decision": "Enregistrer la décision d’approbation",
        "Approval history": "Historique d’approbation",
        "Final reports and exports": "Rapports finaux et exportations",
        "Figures to embed in the validation report": "Figures à intégrer au rapport de validation",
        "Validation and governance reports": "Rapports de validation et de gouvernance",
        "Download validation report (HTML)": "Télécharger le rapport de validation (HTML)",
        "Download governance report (JSON)": "Télécharger le rapport de gouvernance (JSON)",
        "Download approval record": "Télécharger l’enregistrement d’approbation",
        "Download approval history CSV": "Télécharger l’historique d’approbation CSV",
        "Model, project and result exports": "Exportations de modèle, projet et résultats",
        "Download experiment record": "Télécharger l’enregistrement d’expérience",
        "Operational release": "Mise en exploitation",
        "Download approved prediction package": "Télécharger le paquet de prédiction approuvé",
        "Full workspace": "Espace complet",
        "Include original input features in export": "Inclure les variables d’entrée originales dans l’export",
        "Monitor operational performance and revalidation": "Surveiller la performance opérationnelle et la revalidation",
        "Upload monitoring CSV": "Téléverser le CSV de surveillance",
        "Download monitoring record": "Télécharger l’enregistrement de surveillance",
        "Predicted target column": "Colonne cible prédite",
        "Lower interval column": "Colonne de borne inférieure",
        "Upper interval column": "Colonne de borne supérieure",
        "Optional group column": "Colonne de groupe facultative",
        "Optional date column": "Colonne de date facultative",
        "Applicability-status column": "Colonne de statut d’applicabilité",
        "Analyse monitoring data": "Analyser les données de surveillance",
        "Monitoring CSV formats:": "Formats CSV de surveillance :",
        "Revalidation triggers": "Déclencheurs de revalidation",
        "Maximum monitoring RMSE": "RMSE maximale de surveillance",
        "Maximum absolute bias": "Biais absolu maximal",
        "Maximum warning/outside rate": "Taux maximal d’avertissement/hors domaine",
        "Required review date": "Date d’examen requise",
        "Evaluate revalidation triggers": "Évaluer les déclencheurs de revalidation",
        "Model-change assessment": "Évaluation du changement de modèle",
        "Reference experiment": "Expérience de référence",
        "Choose saved experiment…": "Choisir une expérience enregistrée…",
        "Compare models": "Comparer les modèles",
        "Download assessment": "Télécharger l’évaluation",
        "Build and runtime integrity": "Intégrité de construction et d’exécution",
        "Download runtime manifest": "Télécharger le manifeste d’exécution",
        "Local recovery": "Récupération locale",
        "Restore snapshot": "Restaurer l’instantané",
        "Discard snapshot": "Supprimer l’instantané",
        "What the data-quality assistant checks": "Ce que vérifie l’assistant qualité des données",
        "Severity:": "Gravité :"
    },
    "de": {
        "Prepare, compare, validate, approve, operate and monitor regression models locally with versioned governance records.": "Regressionsmodelle lokal vorbereiten, vergleichen, validieren, freigeben, betreiben und überwachen – mit versionierten Governance-Aufzeichnungen.",
        "Predict": "Vorhersage",
        "Monitor": "Überwachung",
        "System": "System",
        "Runtime and integrity": "Laufzeit und Integrität",
        "Recovery": "Wiederherstellung",
        "Help": "Hilfe",
        "User guide": "Benutzerhandbuch",
        "Step 4 model options": "Modelloptionen in Schritt 4",
        "Validation and applicability": "Validierung und Anwendbarkeit",
        "Approval and operation": "Freigabe und Betrieb",
        "Security and privacy": "Sicherheit und Datenschutz",
        "Step 1": "Schritt 1",
        "Step 2": "Schritt 2",
        "Step 3": "Schritt 3",
        "Step 4": "Schritt 4",
        "Step 5": "Schritt 5",
        "Step 6": "Schritt 6",
        "Step 7": "Schritt 7",
        "Step 8": "Schritt 8",
        "Load approved prediction package": "Freigegebenes Vorhersagepaket laden",
        "Prediction-only mode": "Nur-Vorhersage-Modus",
        "Data-quality assistant": "Datenqualitätsassistent",
        "Regression only:": "Nur Regression:",
        "these models predict a continuous numeric target. Classification targets are not supported in this release.": "diese Modelle sagen eine kontinuierliche numerische Zielgröße voraus. Klassifikationsziele werden in dieser Version nicht unterstützt.",
        "Compare several baseline models": "Mehrere Baseline-Modelle vergleichen",
        "Show comparison tools": "Vergleichswerkzeuge anzeigen",
        "Shared-split rule:": "Regel für gemeinsame Aufteilung:",
        "Show baseline comparison settings": "Baseline-Vergleichseinstellungen anzeigen",
        "Baseline settings used in comparison": "Im Vergleich verwendete Baseline-Einstellungen",
        "Speed note": "Geschwindigkeitshinweis",
        "Train selected baseline models": "Ausgewählte Baseline-Modelle trainieren",
        "No comparison batch is running.": "Es läuft kein Vergleichsstapel.",
        "Review, validate, approve, and export": "Prüfen, validieren, freigeben und exportieren",
        "Model comparison workspace": "Arbeitsbereich für Modellvergleich",
        "Sort by": "Sortieren nach",
        "Training time": "Trainingszeit",
        "Chart metric": "Diagrammmetrik",
        "Chart scope": "Diagrammumfang",
        "Comparable experiments only": "Nur vergleichbare Experimente",
        "All experiments, labelled": "Alle Experimente, beschriftet",
        "Table comparable only": "Tabelle nur vergleichbar",
        "Download comparison CSV": "Vergleichs-CSV herunterladen",
        "Remove non-active experiments": "Nicht aktive Experimente entfernen",
        "Selected comparison metric by model": "Ausgewählte Vergleichsmetrik nach Modell",
        "Actual and predicted vs input feature": "Ist- und Vorhersagewert gegen Eingabemerkmal",
        "Training and optimisation history": "Trainings- und Optimierungsverlauf",
        "Validation and acceptance": "Validierung und Akzeptanz",
        "Evaluate active model": "Aktives Modell bewerten",
        "Apply criteria to all comparable models": "Kriterien auf alle vergleichbaren Modelle anwenden",
        "Download validation summary": "Validierungszusammenfassung herunterladen",
        "Test performance by selected group": "Testleistung nach ausgewählter Gruppe",
        "Approval and operational release": "Freigabe und betriebliche Veröffentlichung",
        "Model selected for approval": "Zur Freigabe ausgewähltes Modell",
        "Approval candidate": "Freigabekandidat",
        "No fitted experiment available": "Kein angepasstes Experiment verfügbar",
        "Open selected model for review": "Ausgewähltes Modell zur Prüfung öffnen",
        "Model name": "Modellname",
        "Model developer": "Modellentwickler",
        "Model owner": "Modelleigentümer",
        "Independent reviewer": "Unabhängiger Prüfer",
        "Approver": "Freigeber",
        "Recorded role": "Erfasste Rolle",
        "Developer": "Entwickler",
        "Owner": "Eigentümer",
        "Reviewer": "Prüfer",
        "Administrator": "Administrator",
        "Approval status": "Freigabestatus",
        "Draft": "Entwurf",
        "Under review": "In Prüfung",
        "Validation failed": "Validierung fehlgeschlagen",
        "Approved": "Freigegeben",
        "Approved with conditions": "Mit Bedingungen freigegeben",
        "Suspended": "Ausgesetzt",
        "Expired": "Abgelaufen",
        "Rejected": "Abgelehnt",
        "Retired": "Stillgelegt",
        "Decision date": "Entscheidungsdatum",
        "Next review date": "Nächstes Prüfdatum",
        "Intended use": "Vorgesehene Verwendung",
        "Prohibited or unsupported uses": "Verbotene oder nicht unterstützte Verwendungen",
        "Known limitations": "Bekannte Einschränkungen",
        "Approval conditions": "Freigabebedingungen",
        "Decision notes": "Entscheidungsnotizen",
        "Operational input schema": "Betriebliches Eingabeschema",
        "Record approval decision": "Freigabeentscheidung erfassen",
        "Approval history": "Freigabeverlauf",
        "Final reports and exports": "Abschlussberichte und Exporte",
        "Figures to embed in the validation report": "In den Validierungsbericht einzubettende Abbildungen",
        "Validation and governance reports": "Validierungs- und Governance-Berichte",
        "Download validation report (HTML)": "Validierungsbericht (HTML) herunterladen",
        "Download governance report (JSON)": "Governance-Bericht (JSON) herunterladen",
        "Download approval record": "Freigabeaufzeichnung herunterladen",
        "Download approval history CSV": "Freigabeverlauf-CSV herunterladen",
        "Model, project and result exports": "Modell-, Projekt- und Ergebnisexporte",
        "Download experiment record": "Experimentaufzeichnung herunterladen",
        "Operational release": "Betriebliche Veröffentlichung",
        "Download approved prediction package": "Freigegebenes Vorhersagepaket herunterladen",
        "Full workspace": "Vollständiger Arbeitsbereich",
        "Include original input features in export": "Ursprüngliche Eingabemerkmale in Export aufnehmen",
        "Monitor operational performance and revalidation": "Betriebsleistung und Revalidierung überwachen",
        "Upload monitoring CSV": "Überwachungs-CSV hochladen",
        "Download monitoring record": "Überwachungsaufzeichnung herunterladen",
        "Predicted target column": "Spalte für vorhergesagte Zielgröße",
        "Lower interval column": "Spalte für untere Intervallgrenze",
        "Upper interval column": "Spalte für obere Intervallgrenze",
        "Optional group column": "Optionale Gruppenspalte",
        "Optional date column": "Optionale Datumsspalte",
        "Applicability-status column": "Spalte für Anwendbarkeitsstatus",
        "Analyse monitoring data": "Überwachungsdaten analysieren",
        "Monitoring CSV formats:": "Überwachungs-CSV-Formate:",
        "Revalidation triggers": "Revalidierungsauslöser",
        "Maximum monitoring RMSE": "Maximale Überwachungs-RMSE",
        "Maximum absolute bias": "Maximale absolute Verzerrung",
        "Maximum warning/outside rate": "Maximale Warn-/Außerhalb-Rate",
        "Required review date": "Erforderliches Prüfdatum",
        "Evaluate revalidation triggers": "Revalidierungsauslöser bewerten",
        "Model-change assessment": "Bewertung von Modelländerungen",
        "Reference experiment": "Referenzexperiment",
        "Choose saved experiment…": "Gespeichertes Experiment wählen…",
        "Compare models": "Modelle vergleichen",
        "Download assessment": "Bewertung herunterladen",
        "Build and runtime integrity": "Build- und Laufzeitintegrität",
        "Download runtime manifest": "Laufzeitmanifest herunterladen",
        "Local recovery": "Lokale Wiederherstellung",
        "Restore snapshot": "Schnappschuss wiederherstellen",
        "Discard snapshot": "Schnappschuss verwerfen",
        "What the data-quality assistant checks": "Was der Datenqualitätsassistent prüft",
        "Severity:": "Schweregrad:"
    }
};
  Object.keys(workspaceTranslationsV1011).forEach(language => Object.assign(translations[language] || (translations[language] = {}), workspaceTranslationsV1011[language]));

  const supported = ['en', 'zh-CN', 'es', 'fr', 'de'];
  let selected = 'auto';
  let locale = 'en';

  function resolveLanguage(requested) {
    if (requested && requested !== 'auto') return supported.includes(requested) ? requested : 'en';
    const languages = Array.from(global.navigator.languages || [global.navigator.language || 'en']);
    for (const language of languages) {
      const lower = String(language).toLowerCase();
      if (lower.startsWith('zh')) return 'zh-CN';
      if (lower.startsWith('es')) return 'es';
      if (lower.startsWith('fr')) return 'fr';
      if (lower.startsWith('de')) return 'de';
      if (lower.startsWith('en')) return 'en';
    }
    return 'en';
  }

  function dictionary() { return translations[locale] || {}; }

  function translateSource(source) {
    if (locale === 'en' || !source) return source;
    const dict = dictionary();
    if (Object.prototype.hasOwnProperty.call(dict, source)) return dict[source];

    let result = source;
    const replacements = Object.entries(dict)
      .filter(([key]) => key.length >= 8 && result.includes(key))
      .sort((a, b) => b[0].length - a[0].length);
    for (const [english, translated] of replacements) result = result.split(english).join(translated);

    const dynamic = {
      'zh-CN': [
        [/^(\d+) selected$/, '$1 个已选择'],
        [/^CSV row (\d+)$/, 'CSV 第 $1 行'],
        [/^Loaded ([\d,.\s]+) rows and ([\d,.\s]+) columns locally\.$/, '已在本地加载 $1 行和 $2 列。'],
        [/^Offline mode · /, '离线模式 · '], [/^Hybrid mode · /, '混合模式 · '],
        [/^Predicted (.+) vs (.+)$/, '预测 $1 与 $2'], [/^Measured (.+)$/, '实测 $1']
      ],
      'es': [
        [/^(\d+) selected$/, '$1 seleccionadas'], [/^CSV row (\d+)$/, 'Fila CSV $1'],
        [/^Loaded ([\d,.\s]+) rows and ([\d,.\s]+) columns locally\.$/, 'Se cargaron localmente $1 filas y $2 columnas.'],
        [/^Offline mode · /, 'Modo sin conexión · '], [/^Hybrid mode · /, 'Modo híbrido · '],
        [/^Predicted (.+) vs (.+)$/, '$1 predicho frente a $2'], [/^Measured (.+)$/, '$1 medido']
      ],
      'fr': [
        [/^(\d+) selected$/, '$1 sélectionnées'], [/^CSV row (\d+)$/, 'Ligne CSV $1'],
        [/^Loaded ([\d,.\s]+) rows and ([\d,.\s]+) columns locally\.$/, '$1 lignes et $2 colonnes chargées localement.'],
        [/^Offline mode · /, 'Mode hors ligne · '], [/^Hybrid mode · /, 'Mode hybride · '],
        [/^Predicted (.+) vs (.+)$/, '$1 prédit selon $2'], [/^Measured (.+)$/, '$1 mesuré']
      ],
      'de': [
        [/^(\d+) selected$/, '$1 ausgewählt'], [/^CSV row (\d+)$/, 'CSV-Zeile $1'],
        [/^Loaded ([\d,.\s]+) rows and ([\d,.\s]+) columns locally\.$/, '$1 Zeilen und $2 Spalten lokal geladen.'],
        [/^Offline mode · /, 'Offline-Modus · '], [/^Hybrid mode · /, 'Hybridmodus · '],
        [/^Predicted (.+) vs (.+)$/, 'Prognose $1 gegen $2'], [/^Measured (.+)$/, 'Gemessenes $1']
      ]
    }[locale] || [];
    for (const [pattern, replacement] of dynamic) result = result.replace(pattern, replacement);
    return result;
  }

  function shouldSkip(node) {
    const parent = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !parent || Boolean(parent.closest('script,style,code,pre,.js-plotly-plot,[data-i18n-skip="true"]'));
  }

  function translateTextNode(node) {
    if (shouldSkip(node)) return;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    const match = source.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const core = match ? match[2] : source;
    if (!core.trim()) return;
    node.nodeValue = `${match ? match[1] : ''}${translateSource(core)}${match ? match[3] : ''}`;
  }

  function translateAttributes(element) {
    if (shouldSkip(element)) return;
    const attrs = ['placeholder', 'aria-label', 'title'];
    if (!attrOriginals.has(element)) attrOriginals.set(element, {});
    const original = attrOriginals.get(element);
    for (const attr of attrs) {
      if (!element.hasAttribute(attr)) continue;
      if (!(attr in original)) original[attr] = element.getAttribute(attr);
      element.setAttribute(attr, translateSource(original[attr]));
    }
  }

  function applyTo(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return translateTextNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.currentNode;
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateAttributes(node);
      node = walker.nextNode();
    }
  }

  function applyDocument() {
    locale = resolveLanguage(selected);
    document.documentElement.lang = locale;
    if (!originals.has(document.head.querySelector('title').firstChild)) originals.set(document.head.querySelector('title').firstChild, document.title);
    applyTo(document.documentElement);
    const selector = document.getElementById('languageSelector');
    if (selector) selector.value = selected;
  }

  function setLanguage(value, emit = true) {
    selected = value || 'auto';
    applyDocument();
    if (emit) global.dispatchEvent(new CustomEvent('lrs-language-change', { detail: { selected, locale } }));
  }

  function formatNumber(value, options) {
    return new Intl.NumberFormat(locale, options).format(value);
  }

  function init() {
    const selector = document.getElementById('languageSelector');
    if (selector) selector.addEventListener('change', () => setLanguage(selector.value));
    applyDocument();
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) applyTo(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  global.LRSI18n = {
    get locale() { return locale; },
    get selected() { return selected; },
    setLanguage,
    translate: translateSource,
    formatNumber,
    apply: applyDocument,
    supported: supported.slice()
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
