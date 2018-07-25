using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using OpenQA.Selenium.Support;

namespace SeleniumDemoProject
{

    [TestFixture]
    public class Sample
    {

        [Test]
        public void Test1()
        {
            var driver = new FirefoxDriver();
            driver.Navigate().GoToUrl("https://www.amazon.com");
            driver.Manage().Window.Maximize();
            driver.FindElementById("twotabsearchtextbox").Click();
            System.Threading.Thread.Sleep(2000);
            driver.FindElementById("twotabsearchtextbox").SendKeys("Toys");
            System.Threading.Thread.Sleep(2000);
            driver.FindElement(By.XPath("//*[@id='nav-search']/form/div[2]/div/input")).Click();
            System.Threading.Thread.Sleep(2000);
            driver.Quit();
            Console.WriteLine("Search for Toys in Amazon is successful");
        }
    }
}