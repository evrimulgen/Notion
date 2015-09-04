package edu.mayo.qia.pacs.job;

import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

import edu.mayo.qia.pacs.components.PoolContainer;
import edu.mayo.qia.pacs.components.PoolManager;

public class AutoForwarder implements Job {
  
  @Override
  public void execute(JobExecutionContext context) throws JobExecutionException {
    for ( PoolContainer container : PoolManager.getPoolContainers().values() ) {
      container.processAutoForward();
    }
  } 
}