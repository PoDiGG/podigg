library(psych)

region_cells <- read.csv('../input_data/region_cells.csv')
subset <- region_cells[which(region_cells$density>0 & region_cells$density<30),]

biserial(region_cells$density, region_cells$hasstop) # 0.1756958
biserial(subset$density, subset$hasstop) # 0.4397582
# Outliers distort the correlation a lot!
# We only take a subset of the data, with which we get a correlation of 0.4397582
boxplot(density~hasstop, data=subset)