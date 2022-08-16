// Databricks notebook source
// STARTER CODE - DO NOT EDIT THIS CELL
import org.apache.spark.sql.functions.desc
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._
import spark.implicits._
import org.apache.spark.sql.expressions.Window

// COMMAND ----------

// STARTER CODE - DO NOT EDIT THIS CELL
val customSchema = StructType(Array(StructField("lpep_pickup_datetime", StringType, true), StructField("lpep_dropoff_datetime", StringType, true), StructField("PULocationID", IntegerType, true), StructField("DOLocationID", IntegerType, true), StructField("passenger_count", IntegerType, true), StructField("trip_distance", FloatType, true), StructField("fare_amount", FloatType, true), StructField("payment_type", IntegerType, true)))

// COMMAND ----------

// STARTER CODE - YOU CAN LOAD ANY FILE WITH A SIMILAR SYNTAX.
val df = spark.read
   .format("com.databricks.spark.csv")
   .option("header", "true") // Use first line of all files as header
   .option("nullValue", "null")
   .schema(customSchema)
   .load("/FileStore/tables/nyc_tripdata.csv") // the csv file which you want to work with
   .withColumn("pickup_datetime", from_unixtime(unix_timestamp(col("lpep_pickup_datetime"), "MM/dd/yyyy HH:mm")))
   .withColumn("dropoff_datetime", from_unixtime(unix_timestamp(col("lpep_dropoff_datetime"), "MM/dd/yyyy HH:mm")))
   .drop($"lpep_pickup_datetime")
   .drop($"lpep_dropoff_datetime")

// COMMAND ----------

// LOAD THE "taxi_zone_lookup.csv" FILE SIMILARLY AS ABOVE. CAST ANY COLUMN TO APPROPRIATE DATA TYPE IF NECESSARY.
val df2 = spark.read
  .format("com.databricks.spark.csv")
  .option("header", "true")
  .option("nullValue", "null")
  .load("/FileStore/tables/taxi_zone_lookup.csv")
df2.show()

// ENTER THE CODE BELOW

// COMMAND ----------

// STARTER CODE - DO NOT EDIT THIS CELL
// Some commands that you can use to see your dataframes and results of the operations. You can comment the df.show(5) and uncomment display(df) to see the data differently. You will find these two functions useful in reporting your results.
// display(df)
df.show(5) // view the first 5 rows of the dataframe

// COMMAND ----------

// STARTER CODE - DO NOT EDIT THIS CELL
// Filter the data to only keep the rows where "PULocationID" and the "DOLocationID" are different and the "trip_distance" is strictly greater than 2.0 (>2.0).

// VERY VERY IMPORTANT: ALL THE SUBSEQUENT OPERATIONS MUST BE PERFORMED ON THIS FILTERED DATA

val df_filter = df.filter($"PULocationID" =!= $"DOLocationID" && $"trip_distance" > 2.0)
df_filter.show(5)

// COMMAND ----------

// PART 1a: The top-5 most popular drop locations - "DOLocationID", sorted in descending order - if there is a tie, then one with lower "DOLocationID" gets listed first
// Output Schema: DOLocationID int, number_of_dropoffs int 

// Hint: Checkout the groupBy(), orderBy() and count() functions.

// ENTER THE CODE BELOW

val oneA = df_filter.groupBy("DOLocationID")
                    .agg(expr("count(*) as number_of_dropoffs"))
                    .orderBy($"number_of_dropoffs".desc, $"DOLocationID")
                    .limit(5)
oneA.show()

// COMMAND ----------

// PART 1b: The top-5 most popular pickup locations - "PULocationID", sorted in descending order - if there is a tie, then one with lower "PULocationID" gets listed first 
// Output Schema: PULocationID int, number_of_pickups int

// Hint: Code is very similar to part 1a above.

// ENTER THE CODE BELOW

val oneB = df_filter.groupBy("PULocationID")
                    .agg(expr("count(*) as number_of_pickups"))
                    .orderBy($"number_of_pickups".desc, $"PULocationID")
                    .limit(5)
oneB.show()

// COMMAND ----------

// PART 2: List the top-3 locations with the maximum overall activity, i.e. sum of all pickups and all dropoffs at that LocationID. In case of a tie, the lower LocationID gets listed first.
// Output Schema: LocationID int, number_activities int

// Hint: In order to get the result, you may need to perform a join operation between the two dataframes that you created in earlier parts (to come up with the sum of the number of pickups and dropoffs on each location). 

// ENTER THE CODE BELOW

val oneA = df_filter.groupBy($"DOLocationID")
                .agg(expr("count(*) as number_of_dropoffs"))
                .orderBy($"number_of_dropoffs".desc, $"DOLocationID")
val oneB = df_filter.groupBy("PULocationID")
                .agg(expr("count(*) as number_of_pickups"))
                .orderBy($"number_of_pickups".desc, $"PULocationID")
val activity = oneA.join(oneB, $"PULocationID" === $"DOLocationID")
                .withColumn("number_activities", ($"number_of_pickups" + $"number_of_dropoffs"))
                .select($"DOLocationID".alias("LocationID"), $"number_activities"
                .cast("Integer")).orderBy($"number_activities".desc)

activity.show(3,false)

// COMMAND ----------

// PART 3: List all the boroughs in the order of having the highest to lowest number of activities (i.e. sum of all pickups and all dropoffs at that LocationID), along with the total number of activity counts for each borough in NYC during that entire period of time.
// Output Schema: Borough string, total_number_activities int

// Hint: You can use the dataframe obtained from the previous part, and will need to do the join with the 'taxi_zone_lookup' dataframe. Also, checkout the "agg" function applied to a grouped dataframe.

// ENTER THE CODE BELOW
val three = df2.join(activity, activity("LocationID") === df2("LocationID")).groupBy($"Borough")
                .agg(sum($"number_activities").alias("total_number_activities"))
                .withColumn("total_number_activities", $"total_number_activities".cast("Integer"))
                .orderBy($"total_number_activities".desc)

three.show()

// COMMAND ----------

// PART 4: List the top 2 days of week with the largest number of (daily) average pickups, along with the values of average number of pickups on each of the two days. The day of week should be a string with its full name, for example, "Monday" - not a number 1 or "Mon" instead.
// Output Schema: day_of_week string, avg_count float

// Hint: You may need to group by the "date" (without time stamp - time in the day) first. Checkout "to_date" function.

// ENTER THE CODE BELOW   

val four = 
df_filter
.groupBy(to_date($"pickup_datetime").as("pickup_date")).agg(expr("count(*) as number_of_pickups"))
.withColumn("day_of_week", date_format($"pickup_date", "EEEE"))
.groupBy($"day_of_week").agg(avg("number_of_pickups").cast("float").as("avg_count"))
.orderBy($"avg_count".desc)
.limit(2)

four.show(false)

// COMMAND ----------

// PART 5: For each particular hour of a day (0 to 23, 0 being midnight) - in their order from 0 to 23, find the zone in Brooklyn borough with the LARGEST number of pickups. 
// Output Schema: hour_of_day int, zone string, max_count int

// Hint: You may need to use "Window" over hour of day, along with "group by" to find the MAXIMUM count of pickups

// ENTER THE CODE BELOW

val joinedDF = 
df_filter
.join(df2, $"PULocationID" === $"LocationID", "leftouter")

val five = 
joinedDF
.where($"Borough" === lit("Brooklyn"))
.withColumn("hour_of_day",hour($"pickup_datetime"))
.withColumn("cnt",count("*").over(Window.partitionBy($"hour_of_day",$"Zone")))
.withColumn("rnb",row_number().over(Window.partitionBy($"hour_of_day").orderBy($"cnt".desc)))
.where($"rnb"===1)
.select($"hour_of_day",$"zone",$"cnt".cast("int").as("max_count"))


five
.show(24,false)

// COMMAND ----------

// PART 6 - Find which 3 different days of the January, in Manhattan, saw the largest percentage increment in pickups compared to previous day, in the order from largest increment % to smallest increment %. 
// Print the day of month along with the percent CHANGE (can be negative), rounded to 2 decimal places, in number of pickups compared to previous day.
// Output Schema: day int, percent_change float


// Hint: You might need to use lag function, over a window ordered by day of month.

// ENTER THE CODE BELOW

val windowSpec = Window.orderBy('day_of_month)

val six = 
joinedDF
.where($"Borough" === lit("Manhattan") and month($"pickup_datetime") === lit(1))
.withColumn("day_of_month", dayofmonth($"pickup_datetime"))
.groupBy("day_of_month").agg(count("PULocationID").as("count"))
.withColumn("percentage_change", round(($"count" - lag('count, 1, 0).over(windowSpec))*100/$"count",2))
.orderBy($"percentage_change".desc).where($"day_of_month" gt 1)
.select($"day_of_month".as("day"), $"percentage_change")
.limit(3)

six.show()
