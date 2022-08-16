DESCRIPTION
===========

This package contains below folders

1. DOC - This folder contains final team report and the team poster

2. CODE - This folder contains two folders

   a. Data Analysis - This folder contains multiple files.
   
                      The following "ExploratoryRegressorModelForSymptomPrediction.ipynb" and
                      "ExploratoryForecastingModelForWeather.ipynb" were not used as an output
                      file for the final project, but were used to explore and test for performance of possible models 
                      and were not used for our project deliverables.

                      During the start of the analysis, we wanted to test the performance of certain machine learning models and ideas.
                      shown in "ExploratoryRegressorModelForSymptomPrediction.ipynb". One idea for analysis was to see if we can 
                      accurately predict and forecast search symptoms based off of weather data. For one of the first iterations, we had 
                      the idea of using two separate models – a weather forecasting model and a symptom regressor model. The  weather 
                      forecasting model used an autoregressive model to forecast weather data, and the symptom regressor models, which 
                      include random forest regressors and gradient boost regressors, were used to predict the normalized amount of 
                      searches for a symptom from weather data. The idea was to use the classification model for each time point on
                      the forecasted data. We chose three states – Illinois, California, Florida – for the analysis. 
                      The classification model was first run on random forest. We initially chose to run 10 
                      random counties from California to test the most granularity of accuracy we could achieve. From the average 
                      temperature and average humidity, we predicted on fevers.  Using Scikit-learn RandomForestRegressor, on the 10 
                      random counties, we achieved relatedly low R2 ranging from     -0.04 to 0.48. Mean average percentage error (MAPE)
                      ranged from 2.33% to 7.59%. Using the gradient boosting model also had the same or similar results. The train test 
                      split was 80:20 and data shuffling was used to generalize the predictions. Another model for all the data from all
                      three states were tested, but the R2 value was -0.16, meaning the error was worse than the mean.
                      
                      For the forecasting model in "ExploratoryForecastingModelForWeather.ipynb", it proved to be more accurate. Using 
                      the auto regressor model from the statsmodel library, we were able to achieve a R2 value of 0.71, MAPE of 2.53%, 
                      and MSE of 10.89%. The autoregressive model uses past data to predict future data. It uses temporal correlation to 
                      forecast values based off other inputs. The inputs used were average temperature and average humidity. The model 
                      forecasted the next days average temperature using the past 7 day history. This was one of the starting points                           into moving towards forecasting models.
                     
                      To run the first two files:
                      
                      Save the data mentioned in Step 1 & 2"Execution" below
                      Upload the csv files into Google Drive.
                      Upload the ipynb to your Google Colab (no installation needed as Google Colab has its default ML package) 
                      Replace id’s for Google_Search_Symptoms_and_COVID_Cases_Counties_Daily and covid19_weathersource_com to respective
                      id’s from Google Drive into ipynb files.
                      Run the code & read comments.

                     The following was used to run code for our output and project deliverables.
                     
                      The "Group126_ARIMA_Forecasting.Rmd" which is 
                      used to create the ARIMA training models for forecasting medical 
                      symptoms based on different regressors mentioned in the report.
   
                      This code will load the two datasets mentioned below and create ARIMA
                      models mentioned above and produce two output csv files mentioned
                      below. These output csv files will be used to produce visualization
                      of the data for exploration and Analysis
                      
                      i.  Model_Predictions_All.csv
                      ii. Error_Output_All.csv
                      
                      "Error_Output_All.csv" contains the RMSE & MAPE results for
                      different models. "Model_Predictions_All.csv" contains the actual
                      and predicted results for each of the training model.
                      
                      Note:- Wherever the relevant data is not available the results will
                      shows as "NA"
                      
                      
   b. Visualization -This folder contains the web application made using d3.js, html & css
                     to explore the results that are generated by the data analysis code
                     above
                     
                     i. Data - This folder contains the output files that are generated
                               above along with the json file used to display the USA
                               choropleth map.
                               
                     ii. javascript, css, lib - This folder contains the d3.js code & stylesheet
                         code used and lib folder contains the javascript files that are
                         needed.
                         
                     iii. - Index.html is used to start the application.
                     
                     
INSTALLATION
============

1. Install Python 3.x and R & R Studio Installation & IDE

   
   
   
EXECUTION
=========

-------------------------------------------------------------------------------
NOTE:- IF YOU WANT TO RUN THE VISUALIZATION DIRECTLY PLEASE GO TO STEP NUMBER 5
-------------------------------------------------------------------------------


1. Download "covid dataset" by following the steps below.

   a. Follow the below link and "View Dataset"
      link:- https://console.cloud.google.com/marketplace/product/bigquery-public-datasets/covid19-search-trends?filter=solution-type:dataset&filter=category:covid19&id=11b13b01-661a-43ab-9a47-98cf02b165f9&pli=1  
   b. Input the code below and run the query.
      SELECT * 
      FROM `bigquery-public-data.covid19_symptom_search.counties_daily_2017` 
      UNION ALL
      SELECT * 
      FROM `bigquery-public-data.covid19_symptom_search.counties_daily_2018` 
      UNION ALL
      SELECT * 
      FROM `bigquery-public-data.covid19_symptom_search.counties_daily_2019` 
      UNION ALL
      SELECT * 
      FROM `bigquery-public-data.covid19_symptom_search.counties_daily_2020`
      
   c. Click "Save Results" and store the data on google drive.
   d. Export the csv from google drive to your local computer.
   
   
2. Download "weather dataset" by following the steps below.

   a. Follow the below link and "View Dataset"
      link:- https://console.cloud.google.com/marketplace/product/gcp-public-data-weather-source/weathersource-covid19?filter=solution-type:dataset&q=weather%20source&id=88b8d575-e1cd-48ec-98d0-8fdf2bbddd5f 
   b. Input the code below and run the query.
      SELECT * 
      FROM `bigquery-public-data.covid19_weathersource_com.county_day_history`
   c. Click "Save Results" and store the data on google drive.
   d. Export the csv from google drive to your local computer.
   

3. Load "CODE/Data Analysis/Group126_ARIMA_Forecasting.Rmd" in R Studio IDE and execute. Please
   make sure the download csv files are of same names mentioned in the code.

4. After the output files from training models are created from above steps, move the files
   of "CODE/Visualization/data/" folder.
   
5. start the terminal (command prompt) and go to the folder "CODE/Visualization".
   Start the webserver using python3 using command "python3 -m http.server 8000"

6. Open up the browser and load "localhost:8000/". This should load "index.html" and will 
   start our webpage to show our project's visualization.
   
   
   
